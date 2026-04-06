import { supabaseAdmin } from './supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'IFL_SECRET_KEY_2025_IDEAL_FORMATION_LEADERS_BF'

// Hash password
export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// Generate JWT token
export function generateToken(userId, isAdmin) {
  return jwt.sign(
    { userId, isAdmin, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// Get user from token
export async function getUserFromToken(token) {
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null

  const { data: user, error } = await supabaseAdmin
    .from('ifl_users')
    .select('*')
    .eq('id', decoded.userId)
    .eq('is_active', true)
    .single()

  if (error || !user) return null
  return user
}

// Register user
export async function registerUser({ phone, nom, prenom, password }) {
  // Normalize phone
  const normalizedPhone = phone.startsWith('+226') ? phone : `+226${phone.replace(/^0+/, '')}`

  // Check if exists
  const { data: existing } = await supabaseAdmin
    .from('ifl_users')
    .select('id')
    .eq('phone', normalizedPhone)
    .single()

  if (existing) {
    throw new Error('Ce numéro de téléphone est déjà utilisé.')
  }

  const password_hash = await hashPassword(password)

  const { data: user, error } = await supabaseAdmin
    .from('ifl_users')
    .insert({
      phone: normalizedPhone,
      nom: nom.toUpperCase(),
      prenom,
      password_hash,
      role: 'user',
      is_admin: false
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return user
}

// Login user
export async function loginUser({ phone, password }) {
  const normalizedPhone = phone.startsWith('+226') ? phone : `+226${phone.replace(/^0+/, '')}`

  const { data: user, error } = await supabaseAdmin
    .from('ifl_users')
    .select('*')
    .eq('phone', normalizedPhone)
    .eq('is_active', true)
    .single()

  if (error || !user) {
    throw new Error('Numéro de téléphone ou mot de passe incorrect.')
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    throw new Error('Numéro de téléphone ou mot de passe incorrect.')
  }

  const token = generateToken(user.id, user.is_admin)
  return { user, token }
}

// Check subscription
export function hasActiveSubscription(user, type) {
  if (!user) return false
  if (user.is_admin) return true
  if (!user.abonnement_type || !user.abonnement_valide_jusqua) return false
  if (new Date(user.abonnement_valide_jusqua) < new Date()) return false

  if (type === 'direct') return user.abonnement_type === 'direct' || user.abonnement_type === 'all'
  if (type === 'professionnel') return user.abonnement_type === 'professionnel' || user.abonnement_type === 'all'
  return false
}
