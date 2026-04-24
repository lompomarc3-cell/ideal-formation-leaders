export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

/**
 * 🚨 PHASE 2 — Gestion des promotions de prix.
 *
 * Stockage : table `correction_requests` (multi-usage déjà utilisée pour les paiements)
 * Format du message JSON :
 *   { type: 'ifl_promo', type_concours: 'direct'|'professionnel', prix_promo: int,
 *     date_debut: ISO, date_fin: ISO, is_active: bool }
 * Le user_id sert à pointer vers l'admin créateur. Le status 'approved' = activée, 'rejected' = désactivée.
 */

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

// Helpers parsing
function parsePromo(record) {
  try {
    const parsed = JSON.parse(record.message || '{}')
    if (parsed.type !== 'ifl_promo') return null
    return {
      id: record.id,
      type_concours: parsed.type_concours,
      prix_promo: parsed.prix_promo,
      date_debut: parsed.date_debut,
      date_fin: parsed.date_fin,
      is_active: parsed.is_active !== false && record.status === 'approved',
      created_at: record.created_at,
      label: parsed.label || null
    }
  } catch { return null }
}

function isPromoCurrentlyActive(promo) {
  if (!promo || !promo.is_active) return false
  const now = new Date()
  const debut = promo.date_debut ? new Date(promo.date_debut) : null
  const fin = promo.date_fin ? new Date(promo.date_fin) : null
  if (debut && now < debut) return false
  if (fin && now > fin) return false
  return true
}

export default async function handler(req) {
  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    })
  }

  const url = new URL(req.url)

  // GET → liste de toutes les promotions
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('correction_requests')
        .select('id, message, status, created_at')
        .like('message', '%ifl_promo%')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error

      const promotions = (data || [])
        .map(parsePromo)
        .filter(Boolean)
        .map(p => ({ ...p, is_currently_active: isPromoCurrentlyActive(p) }))

      return new Response(JSON.stringify({ promotions }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // POST → créer une nouvelle promotion
  if (req.method === 'POST') {
    let body = {}
    try { body = await req.json() } catch {}
    const { type_concours, prix_promo, date_debut, date_fin, label, is_active } = body

    if (!type_concours || !['direct', 'professionnel'].includes(type_concours)) {
      return new Response(JSON.stringify({ error: 'type_concours invalide (direct|professionnel)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (!prix_promo || prix_promo <= 0) {
      return new Response(JSON.stringify({ error: 'prix_promo invalide' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (!date_debut || !date_fin) {
      return new Response(JSON.stringify({ error: 'date_debut et date_fin requises' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (new Date(date_fin) <= new Date(date_debut)) {
      return new Response(JSON.stringify({ error: 'date_fin doit être après date_debut' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('correction_requests')
        .insert({
          user_id: adminId,
          question_id: null,
          message: JSON.stringify({
            type: 'ifl_promo',
            type_concours,
            prix_promo: parseInt(prix_promo),
            date_debut,
            date_fin,
            is_active: is_active !== false,
            label: label || null
          }),
          status: (is_active !== false) ? 'approved' : 'rejected',
          admin_response: `Promotion créée par admin le ${new Date().toLocaleString('fr-FR')}`
        })
        .select()
        .single()
      if (error) throw error

      const promo = parsePromo(data)
      return new Response(JSON.stringify({
        success: true,
        promotion: { ...promo, is_currently_active: isPromoCurrentlyActive(promo) }
      }), { status: 201, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // PUT → modifier une promotion (champ par champ ou tout)
  if (req.method === 'PUT') {
    let body = {}
    try { body = await req.json() } catch {}
    const { id, type_concours, prix_promo, date_debut, date_fin, label, is_active } = body

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID manquant' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      // Récupérer la promo existante
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from('correction_requests')
        .select('id, message, status')
        .eq('id', id)
        .maybeSingle()
      if (fetchErr || !existing) {
        return new Response(JSON.stringify({ error: 'Promotion introuvable' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } })
      }
      let parsed = {}
      try { parsed = JSON.parse(existing.message || '{}') } catch {}
      if (parsed.type !== 'ifl_promo') {
        return new Response(JSON.stringify({ error: 'Cet enregistrement n\'est pas une promotion' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } })
      }

      // Appliquer les modifications
      if (type_concours !== undefined) parsed.type_concours = type_concours
      if (prix_promo !== undefined) parsed.prix_promo = parseInt(prix_promo)
      if (date_debut !== undefined) parsed.date_debut = date_debut
      if (date_fin !== undefined) parsed.date_fin = date_fin
      if (label !== undefined) parsed.label = label
      if (is_active !== undefined) parsed.is_active = !!is_active

      const newStatus = parsed.is_active === false ? 'rejected' : 'approved'

      const { data: updated, error: updErr } = await supabaseAdmin
        .from('correction_requests')
        .update({
          message: JSON.stringify(parsed),
          status: newStatus,
          admin_response: `Promotion modifiée le ${new Date().toLocaleString('fr-FR')}`
        })
        .eq('id', id)
        .select()
        .single()
      if (updErr) throw updErr

      const promo = parsePromo(updated)
      return new Response(JSON.stringify({
        success: true,
        promotion: { ...promo, is_currently_active: isPromoCurrentlyActive(promo) }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // DELETE → supprimer définitivement une promotion
  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id')
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID manquant' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    try {
      // Vérifier qu'il s'agit bien d'une promo avant de supprimer
      const { data: existing } = await supabaseAdmin
        .from('correction_requests')
        .select('message')
        .eq('id', id)
        .maybeSingle()
      if (existing) {
        try {
          const parsed = JSON.parse(existing.message || '{}')
          if (parsed.type !== 'ifl_promo') {
            return new Response(JSON.stringify({ error: 'Cet enregistrement n\'est pas une promotion' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } })
          }
        } catch {}
      }
      const { error } = await supabaseAdmin
        .from('correction_requests')
        .delete()
        .eq('id', id)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
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
