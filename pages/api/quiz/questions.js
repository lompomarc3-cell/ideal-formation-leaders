import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  const decoded = token ? verifyToken(token) : null

  const { categorie_id } = req.query
  if (!categorie_id) return res.status(400).json({ error: 'categorie_id requis' })

  // Vérifier si l'utilisateur a accès (abonnement actif)
  if (decoded) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_type, subscription_status, subscription_expires_at, role')
      .eq('id', decoded.userId)
      .single()

    const isAdmin = ['admin', 'superadmin'].includes(profile?.role)
    const isActive = profile?.subscription_status === 'active'
    const notExpired = !profile?.subscription_expires_at ||
      new Date(profile.subscription_expires_at) > new Date()

    if (!isAdmin && !(isActive && notExpired)) {
      return res.status(403).json({ error: 'Abonnement requis pour accéder à ce contenu.' })
    }

    // Vérifier que le type d'abonnement correspond à la catégorie
    if (!isAdmin) {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('type')
        .eq('id', categorie_id)
        .single()

      const subType = profile.subscription_type
      if (cat && subType !== 'all') {
        if (cat.type !== subType) {
          return res.status(403).json({ error: 'Votre abonnement ne couvre pas cette catégorie.' })
        }
      }
    }
  } else {
    return res.status(401).json({ error: 'Connexion requise pour accéder à ce contenu.' })
  }

  // Récupérer les questions
  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('category_id', categorie_id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  // Mapper les champs
  const questions = (data || []).map(q => ({
    id: q.id,
    categorie_id: q.category_id,
    question_text: q.enonce,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    bonne_reponse: q.reponse_correcte,
    explication: q.explication
  }))

  return res.json({ questions })
}
