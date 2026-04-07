export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const decoded = await verifyToken(token)
  if (!decoded) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', decoded.userId)
    .single()
  return (profile?.role === 'superadmin' || profile?.role === 'admin') ? decoded.userId : null
}

export default async function handler(req) {
  // Helper pour compatibilité Edge Runtime
  let body = {}
  if (req.method !== 'GET') {
    try { body = await req.json() } catch {}
  }
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json'}})
  const res = {
    status: (s) => ({ json: (d) => R(d, s) }),
    json: (d) => R(d, 200)
  }
  const reqData = { body, method: req.method, query: {}, headers: req.headers }

  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method === 'GET') {
    const { categorie_id } = req.query
    let query = supabaseAdmin
      .from('questions')
      .select('*, categories(nom, type)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (categorie_id) query = query.eq('category_id', categorie_id)

    const { data, error } = await query.limit(200)
    if (error) return res.status(500).json({ error: error.message })

    const questions = (data || []).map(q => ({
      id: q.id,
      question_text: q.enonce,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      bonne_reponse: q.reponse_correcte,
      explication: q.explication,
      categorie_id: q.category_id,
      is_demo: q.is_demo,
      categories: q.categories
    }))

    return res.json({ questions })
  }

  if (req.method === 'POST') {
    const { categorie_id, question_text, option_a, option_b, option_c, option_d, bonne_reponse, explication } = req.body
    if (!categorie_id || !question_text || !option_a || !option_b || !option_c || !option_d || !bonne_reponse || !explication) {
      return res.status(400).json({ error: 'Tous les champs sont requis' })
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert({
        category_id: categorie_id,
        enonce: question_text,
        option_a, option_b, option_c, option_d,
        reponse_correcte: bonne_reponse.toUpperCase(),
        explication,
        is_demo: false,
        is_active: true,
        matiere: 'QCM',
        difficulte: 'moyen'
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Mettre à jour question_count
    await supabaseAdmin.rpc('increment_question_count', { cat_id: categorie_id }).catch(() => {})
    // Fallback: mise à jour manuelle
    const { count } = await supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categorie_id)
      .eq('is_active', true)
    if (count !== null) {
      await supabaseAdmin.from('categories').update({ question_count: count }).eq('id', categorie_id)
    }

    return res.status(201).json({
      question: {
        id: data.id,
        question_text: data.enonce,
        option_a: data.option_a,
        option_b: data.option_b,
        option_c: data.option_c,
        option_d: data.option_d,
        bonne_reponse: data.reponse_correcte,
        explication: data.explication,
        categorie_id: data.category_id
      }
    })
  }

  if (req.method === 'PUT') {
    const { id, categorie_id, question_text, option_a, option_b, option_c, option_d, bonne_reponse, explication } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    const { data, error } = await supabaseAdmin
      .from('questions')
      .update({
        category_id: categorie_id,
        enonce: question_text,
        option_a, option_b, option_c, option_d,
        reponse_correcte: bonne_reponse.toUpperCase(),
        explication
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.json({
      question: {
        id: data.id,
        question_text: data.enonce,
        option_a: data.option_a,
        option_b: data.option_b,
        option_c: data.option_c,
        option_d: data.option_d,
        bonne_reponse: data.reponse_correcte,
        explication: data.explication,
        categorie_id: data.category_id
      }
    })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'ID requis' })
    const { error } = await supabaseAdmin.from('questions').update({ is_active: false }).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
