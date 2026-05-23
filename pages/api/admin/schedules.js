export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'
import {
  parseDescription,
  buildDescription,
  isScheduleExpired
} from '../../../lib/scheduling'

// Noms des lignes de configuration de programmation globale par type
// Ces lignes ont is_active=false et sont donc invisibles dans les catégories normales
const SCHEDULE_CONFIG_NAMES = {
  direct: '__SCHEDULE_DIRECT__',
  professionnel: '__SCHEDULE_PRO__'
}

async function checkAdmin(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', payload.userId)
    .maybeSingle()
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) return null
  return profile.id
}

/**
 * Lit la programmation globale pour un type donné (direct ou professionnel).
 * Utilise une ligne spéciale is_active=false dans la table categories.
 */
async function getTypeGlobalSchedule(type) {
  const configName = SCHEDULE_CONFIG_NAMES[type]
  if (!configName) return null
  const { data } = await supabaseAdmin
    .from('categories')
    .select('id, description')
    .eq('nom', configName)
    .eq('type', type)
    .eq('is_active', false)
    .maybeSingle()
  if (!data) return null
  const { schedule } = parseDescription(data.description || '')
  return { id: data.id, schedule }
}

/**
 * Met à jour la programmation globale pour un type donné.
 */
async function setTypeGlobalSchedule(type, nextSchedule) {
  const configName = SCHEDULE_CONFIG_NAMES[type]
  if (!configName) return false
  // Récupérer l'ID de la ligne config
  const { data: existing } = await supabaseAdmin
    .from('categories')
    .select('id, description')
    .eq('nom', configName)
    .eq('type', type)
    .eq('is_active', false)
    .maybeSingle()
  if (!existing) return false
  const newDesc = buildDescription('', nextSchedule)
  const { error } = await supabaseAdmin
    .from('categories')
    .update({ description: newDesc })
    .eq('id', existing.id)
  return !error
}

// API admin : gestion de la programmation de disparition des contenus.
// Comme aucune modification de schema n'est possible, on encode dans `categories.description`
// via le marqueur ___SCHEDULE___ (voir lib/scheduling.js)
//
// GET  -> liste toutes les categories avec leur programmation courante + config globale par type
// POST -> { category_ids: string[], date_validite: ISO | null, enabled: bool }  (programmation individuelle)
//      -> { type_global: 'direct'|'professionnel', date_validite: ISO | null, enabled: bool } (programmation globale par type)
export default async function handler(req) {
  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Acces refuse' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('id, nom, type, description, question_count, is_active')
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('nom', { ascending: true })
        .limit(500)

      if (error) throw error

      // Lire aussi les programmations globales par type
      const [directConfig, proConfig] = await Promise.all([
        getTypeGlobalSchedule('direct'),
        getTypeGlobalSchedule('professionnel')
      ])

      const now = new Date()
      const items = (data || []).map(c => {
        const { description, schedule } = parseDescription(c.description)
        const expired = isScheduleExpired(schedule, now)
        return {
          id: c.id,
          nom: c.nom,
          type: c.type,
          description,
          question_count: c.question_count || 0,
          date_validite: schedule.date,
          is_programmed: !!schedule.enabled,
          // v2.3.0 : information sur une éventuelle désactivation persistante
          disabled_at: schedule.disabled_at || null,
          is_disabled_by_admin: schedule.enabled === false && !!schedule.disabled_at,
          expired
        }
      })

      // Formater les configs globales par type
      const formatConfig = (cfg) => {
        if (!cfg) return { date_validite: null, enabled: false, expired: false }
        const expired = isScheduleExpired(cfg.schedule, now)
        return {
          date_validite: cfg.schedule.date,
          enabled: !!cfg.schedule.enabled,
          expired,
          disabled_at: cfg.schedule.disabled_at || null
        }
      }

      return new Response(JSON.stringify({
        categories: items,
        // 🆕 Programmations globales par type
        type_schedules: {
          direct: formatConfig(directConfig),
          professionnel: formatConfig(proConfig)
        }
      }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  if (req.method === 'POST') {
    let body = {}
    try { body = await req.json() } catch {}
    const { category_ids, date_validite, enabled, type_global } = body

    // ─────────────────────────────────────────────────────────────────────
    // 🆕 CAS 1 : Programmation globale par type (direct ou professionnel)
    // ─────────────────────────────────────────────────────────────────────
    if (type_global && (type_global === 'direct' || type_global === 'professionnel')) {
      const isEnabled = enabled !== false && !!date_validite
      let isoDate = null
      if (isEnabled) {
        const d = new Date(date_validite)
        if (isNaN(d.getTime())) {
          return new Response(JSON.stringify({ error: 'Date invalide' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          })
        }
        isoDate = d.toISOString()
      }
      const nowIso = new Date().toISOString()
      let nextSchedule = null
      if (isEnabled) {
        nextSchedule = { date: isoDate, enabled: true }
      } else {
        // Lire la config actuelle pour gérer le disabled_at
        const current = await getTypeGlobalSchedule(type_global)
        const prevSch = current?.schedule || {}
        const hadProg = !!(prevSch.enabled || prevSch.disabled_at || prevSch.date)
        if (hadProg) {
          nextSchedule = { date: prevSch.date || null, enabled: false, disabled_at: nowIso }
        }
      }
      const ok = await setTypeGlobalSchedule(type_global, nextSchedule)
      if (!ok) {
        return new Response(JSON.stringify({ error: 'Ligne de configuration introuvable' }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        })
      }
      const label = type_global === 'direct' ? 'Concours directs' : 'Concours professionnels'
      return new Response(JSON.stringify({
        success: true,
        updated: 1,
        type_global,
        date_validite: isoDate,
        enabled: isEnabled,
        message: isEnabled
          ? `✅ Programmation globale appliquée aux ${label}`
          : `✅ Programmation globale désactivée pour les ${label}`
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    // ─────────────────────────────────────────────────────────────────────
    // CAS 2 : Programmation individuelle par catégorie (existant, inchangé)
    // ─────────────────────────────────────────────────────────────────────
    const isEnabled = enabled !== false && !!date_validite

    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return new Response(JSON.stringify({
        error: 'category_ids doit etre un tableau non vide'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Valider la date si activation demandee
    let isoDate = null
    if (isEnabled) {
      const d = new Date(date_validite)
      if (isNaN(d.getTime())) {
        return new Response(JSON.stringify({
          error: 'Date invalide'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      isoDate = d.toISOString()
    }

    try {
      // Recuperer les descriptions actuelles pour preserver le texte utilisateur
      // ET le contexte de programmation (date prevue, etat precedent...).
      const { data: cats, error: fetchErr } = await supabaseAdmin
        .from('categories')
        .select('id, description')
        .in('id', category_ids)

      if (fetchErr) throw fetchErr

      const nowIso = new Date().toISOString()
      const results = []
      for (const cat of cats || []) {
        const { description: userDesc, schedule: prevSchedule } = parseDescription(cat.description)

        // 🔧 v2.3.0 - DESACTIVATION : on conserve l'information de désactivation
        // (avec disabled_at) pour invalider les anciens abonnements de ce dossier.
        // ACTIVATION  : on remet une programmation active classique et on efface
        // tout précédent état désactivé.
        let nextSchedule
        if (isEnabled) {
          nextSchedule = { date: isoDate, enabled: true }
        } else {
          // Désactivation explicite. On garde la trace via disabled_at uniquement
          // si une programmation existait précédemment (sinon il n'y a rien à
          // invalider).
          const hadProgramming = !!(prevSchedule && (prevSchedule.enabled || prevSchedule.disabled_at || prevSchedule.date))
          if (hadProgramming) {
            nextSchedule = {
              date: prevSchedule.date || null,
              enabled: false,
              // Si une désactivation précédente existait, on prend la plus récente
              // (la nouvelle action admin) pour invalider tout nouvel ancien paiement.
              disabled_at: nowIso
            }
          } else {
            nextSchedule = null // jamais programmé → état neutre
          }
        }

        const newDesc = buildDescription(userDesc, nextSchedule)
        const { error: updErr } = await supabaseAdmin
          .from('categories')
          .update({ description: newDesc })
          .eq('id', cat.id)

        results.push({
          id: cat.id,
          success: !updErr,
          error: updErr?.message || null,
          disabled_at: nextSchedule && nextSchedule.disabled_at ? nextSchedule.disabled_at : null
        })
      }

      return new Response(JSON.stringify({
        success: true,
        updated: results.filter(r => r.success).length,
        total: results.length,
        date_validite: isoDate,
        enabled: isEnabled,
        disabled_at: isEnabled ? null : nowIso,
        results
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { 'Content-Type': 'application/json' }
  })
}
