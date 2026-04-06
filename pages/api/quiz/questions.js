import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { category_id, is_demo } = req.query

  // Vérifier l'auth seulement pour les questions non-démo
  if (!is_demo) {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Connexion requise' })

    const decoded = verifyToken(token)
    if (!decoded) return res.status(401).json({ error: 'Token invalide' })

    // Vérifier l'abonnement si catégorie spécifique
    if (category_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, subscription_status, subscription_type, subscription_expires_at')
        .eq('id', decoded.userId)
        .single()

      const isAdmin = ['admin', 'superadmin'].includes(profile?.role)
      
      if (!isAdmin) {
        // Vérifier l'abonnement
        const { data: category } = await supabaseAdmin
          .from('categories')
          .select('type')
          .eq('id', category_id)
          .single()

        const hasActive = profile?.subscription_status === 'active' &&
          profile?.subscription_expires_at &&
          new Date(profile.subscription_expires_at) > new Date()

        if (!hasActive) {
          return res.status(403).json({ error: 'Abonnement requis pour accéder à ce contenu.' })
        }

        if (category?.type === 'professionnel' && profile?.subscription_type === 'direct') {
          return res.status(403).json({ error: 'Abonnement Concours Professionnels requis.' })
        }
        if (category?.type === 'direct' && profile?.subscription_type === 'professionnel') {
          return res.status(403).json({ error: 'Abonnement Concours Directs requis.' })
        }
      }
    }
  }

  try {
    let query = supabaseAdmin.from('questions').select('*').eq('is_active', true)

    if (is_demo === 'true') {
      query = query.eq('is_demo', true).limit(10)
    } else if (category_id) {
      query = query.eq('category_id', category_id)
    }

    const { data: questions, error } = await query

    if (error) throw error

    return res.json({ questions: questions || [] })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur: ' + error.message })
  }
}
