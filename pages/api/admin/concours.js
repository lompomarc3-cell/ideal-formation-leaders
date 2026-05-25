export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

// ============================================================
// API de gestion des sessions de concours (Direct + Professionnel)
// Stockage dans la table 'announcements' avec le préfixe __CONCOURS__
// dans le titre, et les données JSON dans le champ 'contenu'.
//
// Titre format   : "__CONCOURS__<uuid_session>"
// Contenu format : JSON stringifié avec tous les champs de la session
//
// Champs d'une session :
//   type          : 'direct' | 'professionnel'
//   titre         : string (ex: "Concours Direct ENS 2026")
//   annee         : number (ex: 2026)
//   date_debut    : ISO string | null  (début des inscriptions)
//   date_cloture  : ISO string | null  (clôture des inscriptions)
//   date_examen   : ISO string | null  (date de l'épreuve)
//   date_resultats: ISO string | null  (date des résultats)
//   lieu          : string (ex: "Ouagadougou")
//   description   : string
//   conditions    : string  (conditions d'inscription : diplôme requis, âge, etc.)
//   epreuves      : [{ matiere, duree_min, coefficient, type_epreuve }]
//   postes        : string  (postes ouverts)
//   nombre_postes : number
//   statut        : 'brouillon' | 'publie' | 'archive'
//   is_visible    : boolean  (visible pour les utilisateurs)
//   created_at    : ISO string
//   updated_at    : ISO string
// ============================================================

const CONCOURS_PREFIX = '__CONCOURS__'

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

// Parser une entrée announcements → session concours
function parseSession(row) {
  try {
    const data = JSON.parse(row.contenu || '{}')
    return {
      id: row.id,
      created_at: row.created_at,
      ...data
    }
  } catch {
    return null
  }
}

// Construire le contenu JSON d'une session
function buildContent(sessionData) {
  const {
    type, titre, annee,
    date_debut, date_cloture, date_examen, date_resultats,
    lieu, description, conditions, epreuves,
    postes, nombre_postes, statut, is_visible,
    updated_at
  } = sessionData

  return JSON.stringify({
    type: type || 'direct',
    titre: titre || '',
    annee: annee || new Date().getFullYear(),
    date_debut: date_debut || null,
    date_cloture: date_cloture || null,
    date_examen: date_examen || null,
    date_resultats: date_resultats || null,
    lieu: lieu || '',
    description: description || '',
    conditions: conditions || '',
    epreuves: Array.isArray(epreuves) ? epreuves : [],
    postes: postes || '',
    nombre_postes: nombre_postes || 0,
    statut: statut || 'brouillon',
    is_visible: is_visible !== false,
    updated_at: updated_at || new Date().toISOString()
  })
}

// Valider les règles métier d'une session concours
function validateSession(data) {
  const errors = []

  if (!data.titre || data.titre.trim().length < 3) {
    errors.push('Le titre est obligatoire (minimum 3 caractères)')
  }
  if (!data.type || !['direct', 'professionnel'].includes(data.type)) {
    errors.push("Le type doit être 'direct' ou 'professionnel'")
  }

  // Règle : date de clôture doit être après date de début
  if (data.date_debut && data.date_cloture) {
    const debut = new Date(data.date_debut)
    const cloture = new Date(data.date_cloture)
    if (!isNaN(debut) && !isNaN(cloture) && cloture <= debut) {
      errors.push('La date de clôture doit être après la date de début des inscriptions')
    }
  }

  // Règle : date examen doit être après date de clôture
  if (data.date_cloture && data.date_examen) {
    const cloture = new Date(data.date_cloture)
    const examen = new Date(data.date_examen)
    if (!isNaN(cloture) && !isNaN(examen) && examen <= cloture) {
      errors.push("La date de l'épreuve doit être après la clôture des inscriptions")
    }
  }

  // Règle : date résultats doit être après date examen
  if (data.date_examen && data.date_resultats) {
    const examen = new Date(data.date_examen)
    const resultats = new Date(data.date_resultats)
    if (!isNaN(examen) && !isNaN(resultats) && resultats <= examen) {
      errors.push('La date des résultats doit être après la date des épreuves')
    }
  }

  // Règle : si publié, doit avoir au moins un titre et une date examen
  if (data.statut === 'publie') {
    if (!data.date_examen) {
      errors.push("Une session publiée doit avoir une date d'épreuve")
    }
  }

  // Validation des épreuves
  if (Array.isArray(data.epreuves)) {
    data.epreuves.forEach((ep, i) => {
      if (!ep.matiere || ep.matiere.trim().length === 0) {
        errors.push(`Épreuve ${i + 1} : la matière est obligatoire`)
      }
      if (ep.duree_min !== undefined && ep.duree_min !== null && (isNaN(ep.duree_min) || ep.duree_min < 0)) {
        errors.push(`Épreuve ${i + 1} : durée invalide (en minutes)`)
      }
      if (ep.coefficient !== undefined && ep.coefficient !== null && (isNaN(ep.coefficient) || ep.coefficient <= 0)) {
        errors.push(`Épreuve ${i + 1} : coefficient invalide (doit être > 0)`)
      }
    })
  }

  return errors
}

export default async function handler(req) {
  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    })
  }

  // ─── GET : lister les sessions d'un type ────────────────────────────────
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url)
      const type = url.searchParams.get('type') // 'direct' | 'professionnel' | null (tous)

      const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('id, titre, contenu, is_active, created_at')
        .like('titre', `${CONCOURS_PREFIX}%`)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error

      let sessions = (data || [])
        .map(parseSession)
        .filter(Boolean)

      if (type && ['direct', 'professionnel'].includes(type)) {
        sessions = sessions.filter(s => s.type === type)
      }

      // Trier par date_examen desc, puis created_at desc
      sessions.sort((a, b) => {
        if (a.date_examen && b.date_examen) {
          return new Date(b.date_examen) - new Date(a.date_examen)
        }
        if (a.date_examen) return -1
        if (b.date_examen) return 1
        return new Date(b.created_at) - new Date(a.created_at)
      })

      // Calculer les stats par type
      const directCount = sessions.filter(s => s.type === 'direct').length
      const proCount = sessions.filter(s => s.type === 'professionnel').length
      const publiesCount = sessions.filter(s => s.statut === 'publie').length

      return new Response(JSON.stringify({
        sessions,
        stats: { total: sessions.length, direct: directCount, professionnel: proCount, publies: publiesCount }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // ─── POST : créer une session ─────────────────────────────────────────────
  if (req.method === 'POST') {
    let body = {}
    try { body = await req.json() } catch {}

    const { action } = body

    // Sous-action : supprimer
    if (action === 'delete') {
      const { id } = body
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID manquant' }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        })
      }
      // Vérifier que c'est bien une session concours (sécurité)
      const { data: existing } = await supabaseAdmin
        .from('announcements')
        .select('id, titre')
        .eq('id', id)
        .like('titre', `${CONCOURS_PREFIX}%`)
        .maybeSingle()
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Session introuvable' }), {
          status: 404, headers: { 'Content-Type': 'application/json' }
        })
      }
      const { error } = await supabaseAdmin
        .from('announcements')
        .delete()
        .eq('id', id)
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ success: true, message: 'Session supprimée' }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Sous-action : dupliquer
    if (action === 'duplicate') {
      const { id } = body
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID manquant' }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        })
      }
      const { data: existing } = await supabaseAdmin
        .from('announcements')
        .select('id, titre, contenu')
        .eq('id', id)
        .like('titre', `${CONCOURS_PREFIX}%`)
        .maybeSingle()
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Session introuvable' }), {
          status: 404, headers: { 'Content-Type': 'application/json' }
        })
      }
      const originalData = JSON.parse(existing.contenu || '{}')
      const newSessionData = {
        ...originalData,
        titre: `${originalData.titre} (Copie)`,
        statut: 'brouillon',
        is_visible: false,
        updated_at: new Date().toISOString()
      }
      const newId = crypto.randomUUID()
      const { data: created, error } = await supabaseAdmin
        .from('announcements')
        .insert({
          titre: `${CONCOURS_PREFIX}${newId}`,
          contenu: JSON.stringify(newSessionData),
          is_active: false
        })
        .select('id, titre, contenu, created_at')
        .single()
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({
        success: true,
        session: parseSession(created),
        message: 'Session dupliquée'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    // Création / Mise à jour d'une session
    const { id, ...sessionData } = body

    // Mettre à jour la date
    sessionData.updated_at = new Date().toISOString()

    // Valider les règles métier
    const errors = validateSession(sessionData)
    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors[0], errors }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const contenu = buildContent(sessionData)

    if (id) {
      // Mise à jour
      const { data: existing } = await supabaseAdmin
        .from('announcements')
        .select('id, titre')
        .eq('id', id)
        .like('titre', `${CONCOURS_PREFIX}%`)
        .maybeSingle()
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Session introuvable' }), {
          status: 404, headers: { 'Content-Type': 'application/json' }
        })
      }
      const { data: updated, error } = await supabaseAdmin
        .from('announcements')
        .update({ contenu, is_active: sessionData.is_visible === true })
        .eq('id', id)
        .select('id, titre, contenu, created_at')
        .single()
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({
        success: true,
        session: parseSession(updated),
        message: '✅ Session mise à jour'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } else {
      // Création
      const newId = crypto.randomUUID()
      const { data: created, error } = await supabaseAdmin
        .from('announcements')
        .insert({
          titre: `${CONCOURS_PREFIX}${newId}`,
          contenu,
          is_active: sessionData.is_visible === true
        })
        .select('id, titre, contenu, created_at')
        .single()
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({
        success: true,
        session: parseSession(created),
        message: '✅ Session créée avec succès'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { 'Content-Type': 'application/json' }
  })
}
