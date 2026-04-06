import { supabaseAdmin } from '../../../lib/supabase'
import { getUserFromToken } from '../../../lib/auth'

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Non authentifié' })

  if (req.method === 'GET') {
    const { categorie_id } = req.query
    const query = supabaseAdmin.from('ifl_user_progress').select('*').eq('user_id', user.id)
    if (categorie_id) query.eq('categorie_id', categorie_id)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ progress: data })
  }

  if (req.method === 'POST') {
    const { categorie_id, derniere_question_id, score, total_repondu } = req.body
    if (!categorie_id) return res.status(400).json({ error: 'categorie_id requis' })

    const { data, error } = await supabaseAdmin
      .from('ifl_user_progress')
      .upsert({
        user_id: user.id,
        categorie_id,
        derniere_question_id,
        score: score || 0,
        total_repondu: total_repondu || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,categorie_id' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ progress: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
