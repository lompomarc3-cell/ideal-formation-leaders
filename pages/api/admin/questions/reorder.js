// API de réorganisation des questions QCM — v3.0.11
// Utilise le champ `annee` (INTEGER, toujours NULL en production) comme stockage de l'ordre d'affichage.
// POST { categorie_id: string, ordered_ids: string[] } → met à jour annee = index+1 pour chaque question

export const runtime = 'edge'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verifyToken } from '../../../../lib/auth'

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

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    })
  }

  let body = {}
  try { body = await req.json() } catch {}

  const { categorie_id, ordered_ids } = body

  if (!categorie_id || !Array.isArray(ordered_ids) || ordered_ids.length === 0) {
    return new Response(JSON.stringify({ error: 'categorie_id et ordered_ids requis' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Mettre à jour l'ordre de chaque question en utilisant le champ `annee` comme display_order
    // On traite les mises à jour en parallel par batch pour performance
    const BATCH = 10
    let errors = []

    for (let i = 0; i < ordered_ids.length; i += BATCH) {
      const batch = ordered_ids.slice(i, i + BATCH)
      const updates = batch.map((id, idx) =>
        supabaseAdmin
          .from('questions')
          .update({ annee: i + idx + 1 }) // ordre 1-based
          .eq('id', id)
          .eq('category_id', categorie_id) // sécurité : ne mettre à jour que les questions de cette catégorie
      )
      const results = await Promise.all(updates)
      for (const r of results) {
        if (r.error) errors.push(r.error.message)
      }
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Erreurs partielles', details: errors }), {
        status: 207, headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Ordre mis à jour pour ${ordered_ids.length} questions`,
      total: ordered_ids.length
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
