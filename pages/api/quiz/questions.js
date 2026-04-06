export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { categorie_id } = req.query
  if (!categorie_id) return res.status(400).json({ error: 'categorie_id requis' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  try {
    const { data: user } = await supabaseAdmin
      .from('ifl_users')
      .select('id, abonnement_type, abonnement_valide_jusqua, is_admin')
      .eq('id', decoded.userId)
      .single()

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('id, nom, type, is_active')
      .eq('id', categorie_id)
      .single()

    if (!category || !category.is_active) {
      return res.status(404).json({ error: 'Catégorie non trouvée' })
    }

    if (!user.is_admin) {
      const hasAccess = checkAccess(user, category.type)
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Abonnement requis',
          type: category.type,
          prix: category.type === 'direct' ? 5000 : 20000
        })
      }
    }

    const { data: questions, error } = await supabaseAdmin
      .from('questions')
      .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication')
      .eq('category_id', categorie_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    const normalized = (questions || []).map(q => ({
      id: q.id,
      question_text: q.enonce,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      bonne_reponse: q.reponse_correcte,
      explication: q.explication
    }))

    return res.json({ questions: normalized, category })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

function checkAccess(user, categoryType) {
  if (!user.abonnement_type) return false
  if (user.abonnement_valide_jusqua && new Date(user.abonnement_valide_jusqua) < new Date()) return false
  if (user.abonnement_type === 'all') return true
  return user.abonnement_type === categoryType
}
