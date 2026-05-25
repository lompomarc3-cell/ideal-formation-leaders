export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'
import {
  parseDescription,
  buildDescription,
  isScheduleExpired
} from '../../../lib/scheduling'

// ============================================================
// API /api/admin/programmation
// Gestion des programmations globales par type de concours.
//
// Les données sont stockées dans des lignes spéciales de la table
// `categories` avec is_active=false :
//   __SCHEDULE_GLOBAL__  → programmation globale (tous types)
//   __SCHEDULE_DIRECT__  → programmation concours directs (12 dossiers)
//   __SCHEDULE_PRO__     → programmation concours professionnels (17 dossiers)
//
// GET  → { global_end_date, direct_end_date, professional_end_date }
// POST → { type: 'global'|'direct'|'professionnel', end_date: ISO|null }
// ============================================================

const CONFIG_MAP = {
  global:        { nom: '__SCHEDULE_GLOBAL__',  type: 'direct' },
  direct:        { nom: '__SCHEDULE_DIRECT__',  type: 'direct' },
  professionnel: { nom: '__SCHEDULE_PRO__',      type: 'professionnel' }
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
 * Lire la programmation pour un type donné.
 * Retourne { end_date: ISO|null, enabled: bool, expired: bool }
 */
async function getScheduleForType(typeKey) {
  const cfg = CONFIG_MAP[typeKey]
  if (!cfg) return { end_date: null, enabled: false, expired: false }

  const { data } = await supabaseAdmin
    .from('categories')
    .select('description')
    .eq('nom', cfg.nom)
    .eq('is_active', false)
    .maybeSingle()

  if (!data) return { end_date: null, enabled: false, expired: false }

  const { schedule } = parseDescription(data.description || '')
  const expired = isScheduleExpired(schedule)

  return {
    end_date: schedule.date || null,
    enabled: !!schedule.enabled,
    expired,
    disabled_at: schedule.disabled_at || null
  }
}

/**
 * Mettre à jour la programmation pour un type donné.
 */
async function setScheduleForType(typeKey, endDate) {
  const cfg = CONFIG_MAP[typeKey]
  if (!cfg) return { success: false, error: 'Type inconnu' }

  // Récupérer la ligne existante
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('categories')
    .select('id, description')
    .eq('nom', cfg.nom)
    .eq('is_active', false)
    .maybeSingle()

  if (fetchErr || !existing) {
    return { success: false, error: `Ligne de configuration introuvable pour le type "${typeKey}"` }
  }

  let schedule = null
  if (endDate) {
    const d = new Date(endDate)
    if (isNaN(d.getTime())) return { success: false, error: 'Date invalide' }
    schedule = { date: d.toISOString(), enabled: true }
  } else {
    // Désactivation : conserver la trace disabled_at
    const { schedule: prev } = parseDescription(existing.description || '')
    const hadProg = !!(prev.enabled || prev.disabled_at || prev.date)
    if (hadProg) {
      schedule = { date: prev.date || null, enabled: false, disabled_at: new Date().toISOString() }
    }
    // Si jamais programmé → remettre description vide
  }

  const { description: userDesc } = parseDescription(existing.description || '')
  const newDesc = buildDescription(userDesc, schedule)

  const { error: updErr } = await supabaseAdmin
    .from('categories')
    .update({ description: newDesc })
    .eq('id', existing.id)

  if (updErr) return { success: false, error: updErr.message }
  return { success: true, end_date: schedule?.date || null, enabled: !!schedule?.enabled }
}

// ─────────────────────────────────────────────────────────────────────────────
export default async function handler(req) {
  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    })
  }

  // ─── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const [globalSch, directSch, proSch] = await Promise.all([
        getScheduleForType('global'),
        getScheduleForType('direct'),
        getScheduleForType('professionnel')
      ])

      return new Response(JSON.stringify({
        global_end_date:        globalSch.end_date,
        global_enabled:         globalSch.enabled,
        global_expired:         globalSch.expired,

        direct_end_date:        directSch.end_date,
        direct_enabled:         directSch.enabled,
        direct_expired:         directSch.expired,

        professional_end_date:  proSch.end_date,
        professional_enabled:   proSch.enabled,
        professional_expired:   proSch.expired
      }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // ─── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    let body = {}
    try { body = await req.json() } catch {}

    const { type, end_date } = body

    if (!type || !CONFIG_MAP[type]) {
      return new Response(JSON.stringify({
        error: 'Paramètre "type" invalide. Valeurs acceptées : global, direct, professionnel'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const result = await setScheduleForType(type, end_date || null)

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    const labels = {
      global: 'tous les concours (global)',
      direct: 'les concours directs (12 dossiers)',
      professionnel: 'les concours professionnels (17 dossiers)'
    }

    return new Response(JSON.stringify({
      success: true,
      type,
      end_date: result.end_date,
      enabled: result.enabled,
      message: result.enabled
        ? `✅ Programmation appliquée à ${labels[type]} jusqu'au ${new Date(result.end_date).toLocaleString('fr-FR')}`
        : `✅ Programmation désactivée pour ${labels[type]}`
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { 'Content-Type': 'application/json' }
  })
}
