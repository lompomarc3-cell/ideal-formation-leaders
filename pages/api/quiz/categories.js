import { supabaseAdmin } from '../../../lib/supabase'
import { getUserFromToken } from '../../../lib/auth'

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const user = token ? await getUserFromToken(token) : null

  const { type } = req.query // 'direct' ou 'professionnel'

  // Vérifier l'accès
  if (!user) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (!user.is_admin) {
    if (!user.abonnement_type) {
      return res.status(403).json({ error: 'Abonnement requis', requirePayment: true })
    }
    if (user.abonnement_valide_jusqua && new Date(user.abonnement_valide_jusqua) < new Date()) {
      return res.status(403).json({ error: 'Abonnement expiré', requirePayment: true })
    }
    if (type && user.abonnement_type !== type && user.abonnement_type !== 'all') {
      return res.status(403).json({ error: `Abonnement '${type}' requis`, requirePayment: true })
    }
  }

  try {
    let query = supabaseAdmin.from('ifl_categories').select('*').eq('is_active', true)
    if (type) query = query.eq('type_concours', type)
    query = query.order('ordre', { ascending: true })

    const { data: categories, error } = await query

    if (error) throw error

    return res.json({ categories })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
