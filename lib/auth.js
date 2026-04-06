import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'IFL_SECRET_KEY_2025_IDEAL_FORMATION_LEADERS_BF'

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId, isAdmin) {
  return jwt.sign(
    { userId, isAdmin, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function hasActiveSubscription(user, type) {
  if (!user) return false
  if (user.is_admin) return true
  if (!user.abonnement_type || !user.abonnement_valide_jusqua) return false
  if (new Date(user.abonnement_valide_jusqua) < new Date()) return false
  if (type === 'direct') return ['direct', 'all'].includes(user.abonnement_type)
  if (type === 'professionnel') return ['professionnel', 'all'].includes(user.abonnement_type)
  return false
}
