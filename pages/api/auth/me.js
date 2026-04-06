import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', decoded.userId)
      .maybeSingle()

    if (error || !profile) return res.status(401).json({ error: 'Utilisateur non trouvé' })

    const isAdmin = ['admin', 'superadmin'].includes(profile.role)
    const nameParts = (profile.full_name || '').split(' ')
    const nom = nameParts[0] || ''
    const prenom = nameParts.slice(1).join(' ') || ''

    return res.json({
      user: {
        id: profile.id,
        phone: profile.phone,
        nom,
        prenom,
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
