// Edge-compatible auth utilities using jose + Web Crypto API

const JWT_SECRET = process.env.JWT_SECRET || 'IFL_SECRET_2025_BurkinaFaso_Concours'

// Hash de mot de passe via SHA-256 (compatible Edge Runtime)
// Note: bcryptjs n'est pas compatible Edge, on utilise SHA-256 salted
export async function hashPassword(password) {
  // Générer un salt aléatoire
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
  
  // Support ancien format bcrypt (commence par $2a$ ou $2b$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    // Pour la compatibilité, on doit utiliser bcryptjs ici
    // Sur Edge Runtime, on fait une requête vers un endpoint Node.js
    // Mais comme on migre, on renvoie false et force re-hash
    return false
  }
  
  // Nouveau format SHA-256
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
  
  return false
}

// JWT avec jose (Edge-compatible)
export async function generateToken(userId, isAdmin = false) {
  const { SignJWT } = await import('jose')
  const secret = new TextEncoder().encode(JWT_SECRET)
  
  return new SignJWT({ userId, isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
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
