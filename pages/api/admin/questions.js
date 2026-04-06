import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const { data: p } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', decoded.userId)
    .single()
  return ['admin', 'superadmin'].includes(p?.role) ? decoded.userId : null
}

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  // GET - Liste des questions
  if (req.method === 'GET') {
    const { categorie_id } = req.query
    let query = supabaseAdmin
      .from('questions')
      .select('*, categories(nom, type)')
      .order('created_at', { ascending: false })

    if (categorie_id) query = query.eq('category_id', categorie_id)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    // Mapper les champs pour compatibilité
    const questions = (data || []).map(q => ({
      ...q,
      question_text: q.enonce,
      bonne_reponse: q.reponse_correcte,
      categorie_id: q.category_id,
      ifl_categories: q.categories
    }))

    return res.json({ questions })
  }

  // POST - Ajouter une question
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
        reponse_correcte: bonne_reponse,
        explication,
        is_demo: false,
        is_active: true
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Mettre à jour le compteur de la catégorie
    await supabaseAdmin.rpc('increment_question_count', { cat_id: categorie_id }).catch(() => {
      supabaseAdmin.from('categories')
        .select('question_count')
        .eq('id', categorie_id)
        .single()
        .then(({ data: cat }) => {
          if (cat) {
            supabaseAdmin.from('categories')
              .update({ question_count: (cat.question_count || 0) + 1 })
              .eq('id', categorie_id)
          }
        })
    })

    return res.status(201).json({
      question: {
        ...data,
        question_text: data.enonce,
        bonne_reponse: data.reponse_correcte
      }
    })
  }

  // PUT - Modifier une question
  if (req.method === 'PUT') {
    const { id, categorie_id, question_text, option_a, option_b, option_c, option_d, bonne_reponse, explication } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    const { data, error } = await supabaseAdmin
      .from('questions')
      .update({
        category_id: categorie_id,
        enonce: question_text,
        option_a, option_b, option_c, option_d,
        reponse_correcte: bonne_reponse,
        explication
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.json({
      question: {
        ...data,
        question_text: data.enonce,
        bonne_reponse: data.reponse_correcte
      }
    })
  }

  // DELETE - Supprimer une question
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'ID requis' })

    // Récupérer la catégorie avant suppression
    const { data: q } = await supabaseAdmin.from('questions').select('category_id').eq('id', id).single()

    const { error } = await supabaseAdmin.from('questions').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })

    // Décrémenter le compteur
    if (q?.category_id) {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('question_count')
        .eq('id', q.category_id)
        .single()
      if (cat) {
        await supabaseAdmin.from('categories')
          .update({ question_count: Math.max(0, (cat.question_count || 1) - 1) })
          .eq('id', q.category_id)
      }
    }

    return res.json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
