import { supabaseAdmin } from '../../../lib/supabase'
import { getUserFromToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  return user?.is_admin ? user : null
}

export default async function handler(req, res) {
  const admin = await checkAdmin(req)
  if (!admin) return res.status(403).json({ error: 'Accès admin requis' })

  if (req.method === 'GET') {
    const { categorie_id, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('ifl_questions')
      .select('*, ifl_categories(nom, type_concours)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (categorie_id) query = query.eq('categorie_id', categorie_id)

    const { data: questions, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ questions, total: count })
  }

  if (req.method === 'POST') {
    const { categorie_id, question_text, option_a, option_b, option_c, option_d, bonne_reponse, explication } = req.body

    if (!question_text || !option_a || !option_b || !option_c || !option_d || !bonne_reponse || !explication) {
      return res.status(400).json({ error: 'Tous les champs sont requis' })
    }

    const { data, error } = await supabaseAdmin
      .from('ifl_questions')
      .insert({
        categorie_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        bonne_reponse: bonne_reponse.toUpperCase(),
        explication,
        is_demo: false,
        is_active: true
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ question: data })
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    if (updates.bonne_reponse) updates.bonne_reponse = updates.bonne_reponse.toUpperCase()

    const { data, error } = await supabaseAdmin
      .from('ifl_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ question: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'ID requis' })

    const { error } = await supabaseAdmin
      .from('ifl_questions')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
