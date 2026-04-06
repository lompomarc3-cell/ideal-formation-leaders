export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  try {
    const { data: user, error } = await supabaseAdmin
      .from('ifl_users')
      .select('id, phone, nom, prenom, role, is_admin, abonnement_type, abonnement_valide_jusqua, is_active, created_at')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    return res.json({
      user: {
        id: user.id,
        phone: user.phone,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        is_admin: user.is_admin,
        abonnement_type: user.abonnement_type,
        abonnement_valide_jusqua: user.abonnement_valide_jusqua,
        is_active: user.is_active
      }
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message })
  }
}
