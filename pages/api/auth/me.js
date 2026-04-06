import { getUserFromToken } from '../../../lib/auth'

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.ifl_token
  
  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const user = await getUserFromToken(token)
  
  if (!user) {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }

  return res.json({
    user: {
      id: user.id,
      phone: user.phone,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      is_admin: user.is_admin,
      abonnement_type: user.abonnement_type,
      abonnement_valide_jusqua: user.abonnement_valide_jusqua
    }
  })
}
