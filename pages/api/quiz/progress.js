import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  // GET - Récupérer la progression pour une catégorie
  if (req.method === 'GET') {
    const { categorie_id } = req.query

    const { data: progress } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', decoded.userId)
      .eq('question_id', categorie_id) // On réutilise question_id pour stocker l'info
      .maybeSingle()

    return res.json({ progress: progress || null })
  }

  // POST - Sauvegarder la progression
  if (req.method === 'POST') {
    const { categorie_id, derniere_question_id, score } = req.body
    if (!categorie_id) return res.status(400).json({ error: 'categorie_id requis' })

    // Stocker la progression dans une structure JSON dans user_progress
    // On utilise les champs disponibles de façon créative
    try {
      const { data: existing } = await supabaseAdmin
        .from('user_progress')
        .select('id')
        .eq('user_id', decoded.userId)
        .eq('question_id', categorie_id)
        .maybeSingle()

      if (existing) {
        await supabaseAdmin
          .from('user_progress')
          .update({
            is_correct: score ? true : false, // utiliser is_correct comme flag
            created_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        await supabaseAdmin
          .from('user_progress')
          .insert({
            user_id: decoded.userId,
            question_id: categorie_id,
            is_correct: score ? true : false
          })
      }

      return res.json({ success: true })
    } catch (e) {
      return res.json({ success: false, error: e.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
