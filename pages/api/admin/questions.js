export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = await verifyToken(token)
  if (!decoded) return null
  const { data: user } = await supabaseAdmin
    .from('ifl_users')
    .select('id, is_admin, role')
    .eq('id', decoded.userId)
    .single()
  return (user?.is_admin || user?.role === 'admin') ? decoded.userId : null
}

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method === 'GET') {
    const { categorie_id } = req.query
    let query = supabaseAdmin
      .from('questions')
      .select('*, categories(nom, type)')
      .order('created_at', { ascending: false })

    if (categorie_id) query = query.eq('category_id', categorie_id)

    const { data, error } = await query.limit(100)
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
      ifl_categories: q.categories
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
    const { error } = await supabaseAdmin.from('questions').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
