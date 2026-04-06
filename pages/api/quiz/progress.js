export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  const { categorie_id } = req.query

  if (req.method === 'GET') {
    if (!categorie_id) return res.status(400).json({ error: 'categorie_id requis' })

    const { data, error } = await supabaseAdmin
      .from('ifl_user_progress')
      .select('*')
      .eq('user_id', decoded.userId)
      .eq('categorie_id', categorie_id)
      .maybeSingle()

    return res.json({ progress: data || null })
  }

  if (req.method === 'POST') {
    const { categorie_id: catId, derniere_question_id, score, total_reponses } = req.body
    if (!catId) return res.status(400).json({ error: 'categorie_id requis' })

    const { data, error } = await supabaseAdmin
      .from('ifl_user_progress')
      .upsert({
        user_id: decoded.userId,
        categorie_id: catId,
        derniere_question_id: derniere_question_id || null,
        score: score || 0,
        total_reponses: total_reponses || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,categorie_id' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ progress: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
