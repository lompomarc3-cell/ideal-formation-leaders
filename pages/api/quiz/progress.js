import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Connexion requise' })

  const decoded = verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  const userId = decoded.userId

  if (req.method === 'GET') {
    const { category_id } = req.query
    try {
      let query = supabaseAdmin
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)

      if (category_id) {
        query = query.eq('question_id', category_id) // user_progress utilise question_id
      }

      const { data, error } = await query
      if (error) throw error
      return res.json({ progress: data || [] })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'POST') {
    const { category_id, question_id, score } = req.body
    try {
      // Sauvegarder la progression
      const { data, error } = await supabaseAdmin
        .from('user_progress')
        .upsert({
          user_id: userId,
          question_id: question_id || null
        }, { onConflict: 'user_id,question_id' })
        .select()
        .single()

      if (error) throw error
      return res.json({ success: true, progress: data })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
