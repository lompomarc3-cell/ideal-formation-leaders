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

  // GET: lister les questions
  if (req.method === 'GET') {
    try {
      const categorieId = url.searchParams.get('categorie_id')
      
      let query = supabaseAdmin
        .from('questions')
        .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo, is_active, category_id, categories(nom, type)')
        .eq('is_active', true)
        .limit(200)

      if (categorieId) query = query.eq('category_id', categorieId)

      const { data: questions, error } = await query

      if (error) throw error

      return new Response(JSON.stringify({
        questions: (questions || []).map(q => ({
          id: q.id,
          category_id: q.category_id,
          categorie_nom: q.categories?.nom || '',
          categorie_type: q.categories?.type || '',
          question_text: q.enonce,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          bonne_reponse: q.reponse_correcte,
          explication: q.explication,
          is_demo: q.is_demo
        }))
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // POST: ajouter une question
  if (req.method === 'POST') {
    let body = {}
    try { body = await req.json() } catch {}
    const { category_id, question_text, option_a, option_b, option_c, option_d, bonne_reponse, explication } = body

    if (!category_id || !question_text || !option_a || !option_b || !option_c || !option_d || !bonne_reponse) {
      return new Response(JSON.stringify({ error: 'Tous les champs sont requis' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const { data: q, error } = await supabaseAdmin
        .from('questions')
        .insert({
          category_id,
          enonce: question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          reponse_correcte: bonne_reponse,
          explication: explication || '',
          matiere: 'QCM',
          difficulte: 'moyen',
          is_demo: false,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      // Incrémenter le compteur
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('question_count')
        .eq('id', category_id)
        .single()

      if (cat) {
        await supabaseAdmin
          .from('categories')
          .update({ question_count: (cat.question_count || 0) + 1 })
          .eq('id', category_id)
      }

      return new Response(JSON.stringify({ success: true, question: q }), {
        status: 201, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // PUT: modifier une question
  if (req.method === 'PUT') {
    let body = {}
    try { body = await req.json() } catch {}
    const { id, question_text, option_a, option_b, option_c, option_d, bonne_reponse, explication } = body

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const updates = {}
      if (question_text) updates.enonce = question_text
      if (option_a) updates.option_a = option_a
      if (option_b) updates.option_b = option_b
      if (option_c) updates.option_c = option_c
      if (option_d) updates.option_d = option_d
      if (bonne_reponse) updates.reponse_correcte = bonne_reponse
      if (explication !== undefined) updates.explication = explication

      const { data: q, error } = await supabaseAdmin
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ success: true, question: q }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // DELETE: supprimer (soft delete)
  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id')
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const { error } = await supabaseAdmin
        .from('questions')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
}
