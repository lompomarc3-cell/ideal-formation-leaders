export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyPassword, generateToken } from '../../../lib/auth'
import { rateLimit, tooManyRequests } from '../../../lib/rate-limit'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  // 🛡️ Rate limit : 10 tentatives / minute / IP, blocage 5 min en cas d'abus
  const rl = rateLimit(req, { key: 'login', max: 10, windowMs: 60_000, blockMs: 5 * 60_000 })
  if (!rl.allowed) return tooManyRequests(rl.resetIn)

  let body = {}
  try { body = await req.json() } catch {}
  const { phone, password } = body

  if (!phone || !password) {
    return new Response(JSON.stringify({ error: 'Téléphone et mot de passe requis.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  let normalizedPhone = phone.trim().replace(/\s/g, '')
  if (!normalizedPhone.startsWith('+226')) {
    normalizedPhone = '+226' + normalizedPhone.replace(/^0+/, '')
  }

  try {
    // 1. Chercher le profil par téléphone
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Numéro de téléphone ou mot de passe incorrect.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    // 2. Récupérer le hash depuis correction_requests
    // 🔧 FIX #2 : Récupérer TOUS les enregistrements ifl_auth (sans limite) pour trouver le bon hash
    // après plusieurs changements de mot de passe ou réinscriptions.
    const { data: authRecords } = await supabaseAdmin
      .from('correction_requests')
      .select('message, admin_response, created_at')
      .eq('user_id', profile.id)
      .not('message', 'is', null)
      .like('message', '%ifl_auth%')
      .order('created_at', { ascending: false })
      .limit(50)

    let passwordHash = null
    if (authRecords && authRecords.length > 0) {
      for (const record of authRecords) {
        try {
          const parsed = JSON.parse(record.message)
          if (parsed.type === 'ifl_auth' && parsed.password_hash) {
            passwordHash = parsed.password_hash
            break
          }
        } catch {}
        if (!passwordHash && record.admin_response && record.admin_response.startsWith('sha256:')) {
          passwordHash = record.admin_response
          break
        }
      }
    }

    // 🔧 FIX #2 : Fallback - chercher aussi dans les enregistrements généraux (admin_response)
    if (!passwordHash) {
      const { data: anyRecords } = await supabaseAdmin
        .from('correction_requests')
        .select('admin_response, message')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (anyRecords) {
        for (const r of anyRecords) {
          if (r.admin_response && r.admin_response.startsWith('sha256:')) {
            passwordHash = r.admin_response
            break
          }
          // Cherche aussi dans message s'il y a un sha256:
          if (r.message && r.message.includes('sha256:')) {
            const match = r.message.match(/sha256:[a-f0-9-]+:[a-f0-9]+/i)
            if (match) {
              passwordHash = match[0]
              break
            }
          }
        }
      }
    }

    if (!passwordHash) {
      return new Response(JSON.stringify({ error: 'Numéro de téléphone ou mot de passe incorrect.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    const valid = await verifyPassword(password, passwordHash)
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Numéro de téléphone ou mot de passe incorrect.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    // 🔧 FIX #2 : NE JAMAIS bloquer la connexion à cause d'un abonnement expiré.
    // L'utilisateur DOIT pouvoir se reconnecter pour se réabonner.
    // L'expiration est gérée côté questions.js (limite aux 5 questions gratuites).

    const isAdmin = profile.role === 'superadmin' || profile.role === 'admin'
    const token = await generateToken(profile.id, isAdmin)

    const nameParts = (profile.full_name || '').trim().split(' ')
    const nom = nameParts[0] || ''
    const prenom = nameParts.slice(1).join(' ') || ''

    // 🔧 FIX #1/#3 : Calculer le statut réel (expired si date passée)
    const now = new Date()
    const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
    const isExpired = profile.subscription_status === 'active' && expiresAt && expiresAt < now
    const realStatus = isExpired ? 'expired' : profile.subscription_status

    return new Response(JSON.stringify({
      success: true,
      token,
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
        subscription_status: realStatus,
        subscription_expired: isExpired,
        is_active: true
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
