import { supabaseAdmin } from '../../../lib/supabase'
import { getUserFromToken } from '../../../lib/auth'

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const user = token ? await getUserFromToken(token) : null
  const { categorie_id } = req.query

  if (!user) return res.status(401).json({ error: 'Connexion requise' })
  if (!categorie_id) return res.status(400).json({ error: 'categorie_id requis' })

  try {
    // Récupérer la catégorie pour vérifier le type
    const { data: cat } = await supabaseAdmin
      .from('ifl_categories')
      .select('type_concours')
      .eq('id', categorie_id)
      .single()

    if (!user.is_admin && cat) {
      if (!user.abonnement_type) {
        return res.status(403).json({ error: 'Abonnement requis', requirePayment: true })
      }
      if (user.abonnement_valide_jusqua && new Date(user.abonnement_valide_jusqua) < new Date()) {
        return res.status(403).json({ error: 'Abonnement expiré' })
      }
      if (user.abonnement_type !== cat.type_concours && user.abonnement_type !== 'all') {
        return res.status(403).json({ error: 'Abonnement inadapté', requirePayment: true })
      }
    }

    const { data: questions, error } = await supabaseAdmin
      .from('ifl_questions')
      .select('*')
      .eq('categorie_id', categorie_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error

    return res.json({ questions })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
