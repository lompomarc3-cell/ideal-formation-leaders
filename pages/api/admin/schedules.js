export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'
import {
  parseDescription,
  buildDescription,
  isScheduleExpired
} from '../../../lib/scheduling'

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

// API admin : gestion de la programmation de disparition des contenus.
// Comme aucune modification de schema n'est possible, on encode dans `categories.description`
// via le marqueur ___SCHEDULE___ (voir lib/scheduling.js)
//
// GET  -> liste toutes les categories avec leur programmation courante
// POST -> { category_ids: string[], date_validite: ISO | null, enabled: bool }
//         date_validite=null ou enabled=false => desactive la programmation.
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
          expired
        }
      })

      return new Response(JSON.stringify({ categories: items }), {
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
    const { category_ids, date_validite, enabled } = body
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
      const { data: cats, error: fetchErr } = await supabaseAdmin
        .from('categories')
        .select('id, description')
        .in('id', category_ids)

      if (fetchErr) throw fetchErr

      const results = []
      for (const cat of cats || []) {
        const { description: userDesc } = parseDescription(cat.description)
        const newDesc = buildDescription(
          userDesc,
          isEnabled ? { date: isoDate, enabled: true } : null
        )
        const { error: updErr } = await supabaseAdmin
          .from('categories')
          .update({ description: newDesc })
          .eq('id', cat.id)

        results.push({
          id: cat.id,
          success: !updErr,
          error: updErr?.message || null
        })
      }

      return new Response(JSON.stringify({
        success: true,
        updated: results.filter(r => r.success).length,
        total: results.length,
        date_validite: isoDate,
        enabled: isEnabled,
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
