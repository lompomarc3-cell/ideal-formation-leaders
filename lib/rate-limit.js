// Rate limiter Edge-compatible (in-memory, par IP)
// Protège les endpoints sensibles contre brute-force et abus
// IMPORTANT: en environnement Cloudflare Workers/Pages, chaque worker a sa propre mémoire
// donc le rate limit est par-worker. Pour 99% des cas (attaques basiques) c'est suffisant.

// Map: ip => { count, firstAttempt, blockedUntil }
const buckets = new Map()
const MAX_BUCKETS = 5000 // protection mémoire

function getClientIp(req) {
  // Cloudflare envoie l'IP réelle dans CF-Connecting-IP
  return req.headers.get('cf-connecting-ip')
      || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
}

/**
 * Vérifie si la requête est autorisée selon le rate limit configuré.
 * @param {Request} req - la requête entrante
 * @param {Object} opts - { key: string identifiant, max: nb max, windowMs: durée fenêtre, blockMs: durée blocage si dépassé }
 * @returns {Object} - { allowed: boolean, remaining: number, resetIn: number }
 */
export function rateLimit(req, opts = {}) {
  const {
    key = 'default',
    max = 10,
    windowMs = 60_000,    // 1 minute
    blockMs = 5 * 60_000  // 5 minutes
  } = opts

  // Garde-fou mémoire : si trop d'entrées, on purge les anciennes
  if (buckets.size > MAX_BUCKETS) {
    const now = Date.now()
    for (const [k, b] of buckets) {
      if (b.firstAttempt + windowMs < now && (!b.blockedUntil || b.blockedUntil < now)) {
        buckets.delete(k)
      }
    }
  }

  const ip = getClientIp(req)
  const bucketKey = `${key}:${ip}`
  const now = Date.now()

  let bucket = buckets.get(bucketKey)
  if (!bucket) {
    bucket = { count: 0, firstAttempt: now, blockedUntil: 0 }
    buckets.set(bucketKey, bucket)
  }

  // Si actuellement bloqué
  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((bucket.blockedUntil - now) / 1000)
    }
  }

  // Reset de la fenêtre si elle est expirée
  if (now - bucket.firstAttempt > windowMs) {
    bucket.count = 0
    bucket.firstAttempt = now
    bucket.blockedUntil = 0
  }

  bucket.count++

  if (bucket.count > max) {
    bucket.blockedUntil = now + blockMs
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil(blockMs / 1000)
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, max - bucket.count),
    resetIn: Math.ceil((bucket.firstAttempt + windowMs - now) / 1000)
  }
}

/**
 * Helper pour retourner une 429 Too Many Requests
 */
export function tooManyRequests(resetIn) {
  return new Response(JSON.stringify({
    error: `Trop de tentatives. Veuillez réessayer dans ${resetIn} secondes.`,
    retry_after: resetIn
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(resetIn)
    }
  })
}
