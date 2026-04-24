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

// API pour la gestion des dissertations brutes (long texte, sans QCM)
// Les dissertations sont stockees dans la table `questions` avec matiere='dissertation'
// - enonce : titre de la dissertation
// - explication : contenu long (corrige)
// - option_a/b/c/d : 'N/A' (non affichees dans le frontend)
// - reponse_correcte : 'A' (placeholder)
export default async function handler(req) {
  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Acces refuse' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    })
  }

  const url = new URL(req.url)

  if (req.method === 'GET') {
    try {
      const categorieId = url.searchParams.get('categorie_id')
      let query = supabaseAdmin
        .from('questions')
        .select('id, enonce, explication, matiere, category_id, is_active, created_at, categories(nom, type)')
        .eq('is_active', true)
        .in('matiere', ['dissertation', 'Dissertation', 'DISSERTATION', 'etude_cas', 'etude de cas'])
        .order('created_at', { ascending: false })
        .limit(500)

      if (categorieId) query = query.eq('category_id', categorieId)

      const { data, error } = await query
      if (error) throw error

      return new Response(JSON.stringify({
        dissertations: (data || []).map(d => ({
          id: d.id,
          category_id: d.category_id,
          categorie_nom: d.categories?.nom || '',
          categorie_type: d.categories?.type || '',
          titre: d.enonce,
          contenu: d.explication,
          matiere: d.matiere,
          created_at: d.created_at
        }))
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  if (req.method === 'POST') {
    let body = {}
    try { body = await req.json() } catch {}
    const { category_id, titre, contenu } = body

    if (!category_id || !titre || !contenu) {
      return new Response(JSON.stringify({
        error: 'La categorie, le titre et le contenu sont requis'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const { data: q, error } = await supabaseAdmin
        .from('questions')
        .insert({
          category_id,
          enonce: titre,
          option_a: 'N/A',
          option_b: 'N/A',
          option_c: 'N/A',
          option_d: 'N/A',
          reponse_correcte: 'A',
          explication: contenu,
          matiere: 'dissertation',
          difficulte: 'moyen',
          is_demo: false,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

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

      return new Response(JSON.stringify({ success: true, dissertation: q }), {
        status: 201, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  if (req.method === 'PUT') {
    let body = {}
    try { body = await req.json() } catch {}
    const { id, titre, contenu, category_id } = body

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID manquant' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    try {
      const updates = {}
      if (titre) updates.enonce = titre
      if (contenu !== undefined) updates.explication = contenu
      if (category_id) updates.category_id = category_id

      const { data: q, error } = await supabaseAdmin
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ success: true, dissertation: q }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id')
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID manquant' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
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
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { 'Content-Type': 'application/json' }
  })
}
