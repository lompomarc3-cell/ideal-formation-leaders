// Auth utilities - Edge Runtime compatible
// Utilise Web Crypto API (disponible dans Edge/Cloudflare Workers)

const JWT_SECRET = process.env.JWT_SECRET || 'IFL_SECRET_2025_BurkinaFaso_Concours_Secure'

// Hash SHA-256 salted (Edge compatible, pas bcrypt)
export async function hashPassword(password) {
  const salt = crypto.randomUUID()
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt + 'IFL_SALT_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `sha256:${salt}:${hashHex}`
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash) return false
  
  // Format SHA-256 (nouveau format)
  if (storedHash.startsWith('sha256:')) {
    const parts = storedHash.split(':')
    if (parts.length !== 3) return false
    const [, salt, expectedHash] = parts
    const encoder = new TextEncoder()
    const data = encoder.encode(password + salt + 'IFL_SALT_2025')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex === expectedHash
  }

  // Format bcrypt (hash ancien) - nécessite bcryptjs (non-Edge)
  // On retourne false pour forcer re-création via admin
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    // Vérification bcrypt via Node.js
    try {
      const bcrypt = await import('bcryptjs')
      return bcrypt.compare(password, storedHash)
    } catch {
      return false
    }
  }
  
  return false
}

// JWT avec jose (Edge-compatible)
export async function generateToken(userId, isAdmin = false) {
  const { SignJWT } = await import('jose')
  const secret = new TextEncoder().encode(JWT_SECRET)
  // Durée de session : 7 jours (sécurité renforcée vs 30j)
  return new SignJWT({ userId, isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token) {
  try {
    const { jwtVerify } = await import('jose')
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}
