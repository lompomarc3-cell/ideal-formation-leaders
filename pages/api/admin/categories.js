export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

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
  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  const url = new URL(req.url)

  // GET: lister toutes les catégories avec le nombre de questions réel
  if (req.method === 'GET') {
    try {
      const { data: categories, error } = await supabaseAdmin
        .from('categories')
        .select('id, nom, type, description, question_count, prix, is_active, created_at')
        .order('type', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error

      // Pour chaque catégorie, compter les questions actives
      const catsWithCount = await Promise.all((categories || []).map(async (c) => {
        const { count } = await supabaseAdmin
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', c.id)
          .eq('is_active', true)
        return {
          ...c,
          question_count_real: count || 0
        }
      }))

      return new Response(JSON.stringify({ categories: catsWithCount }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // POST: créer une nouvelle catégorie
  if (req.method === 'POST') {
    let body = {}
    try { body = await req.json() } catch {}
    const { nom, type, description } = body

    if (!nom || !type) {
      return new Response(JSON.stringify({ error: 'Nom et type requis' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (!['direct', 'professionnel'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Type invalide. Doit être "direct" ou "professionnel"' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const prix = type === 'direct' ? 5000 : 20000

      const { data: cat, error } = await supabaseAdmin
        .from('categories')
        .insert({
          nom: nom.trim(),
          type,
          description: description || '',
          question_count: 0,
          prix,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ success: true, category: cat }), {
        status: 201, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // PUT: modifier une catégorie
  if (req.method === 'PUT') {
    let body = {}
    try { body = await req.json() } catch {}
    const { id, nom, description, is_active } = body

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const updates = {}
      if (nom !== undefined) updates.nom = nom.trim()
      if (description !== undefined) updates.description = description
      if (is_active !== undefined) updates.is_active = is_active

      const { data: cat, error } = await supabaseAdmin
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ success: true, category: cat }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // DELETE: désactiver une catégorie (soft delete) + désactiver ses questions
  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id')
    const force = url.searchParams.get('force') === 'true'

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      // Vérifier le nombre de questions
      const { count } = await supabaseAdmin
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)
        .eq('is_active', true)

      if (!force && count > 0) {
        return new Response(JSON.stringify({
          error: `Ce dossier contient ${count} question(s) active(s). Confirmez la suppression.`,
          requiresConfirmation: true,
          questionCount: count
        }), { status: 409, headers: { 'Content-Type': 'application/json' } })
      }

      // Désactiver les questions du dossier
      if (count > 0) {
        await supabaseAdmin
          .from('questions')
          .update({ is_active: false })
          .eq('category_id', id)
      }

      // Désactiver la catégorie
      const { error } = await supabaseAdmin
        .from('categories')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true, deletedQuestions: count || 0 }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
}
