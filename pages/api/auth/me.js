import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token manquant' })

  const decoded = verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide ou expiré' })

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (error || !profile) {
      return res.status(401).json({ error: 'Utilisateur introuvable' })
    }

    const isAdmin = ['admin', 'superadmin'].includes(profile.role)

    return res.json({
      user: {
        id: profile.id,
        phone: profile.phone,
        nom: profile.full_name?.split(' ')[0] || '',
        prenom: profile.full_name?.split(' ').slice(1).join(' ') || '',
        full_name: profile.full_name,
        role: profile.role,
        is_admin: isAdmin,
        abonnement_type: profile.subscription_type,
        abonnement_valide_jusqua: profile.subscription_expires_at,
        subscription_status: profile.subscription_status
      }
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
