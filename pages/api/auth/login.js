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
    const { data: authRecords } = await supabaseAdmin
      .from('correction_requests')
      .select('message, admin_response')
      .eq('user_id', profile.id)
      .not('message', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

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

    const isAdmin = profile.role === 'superadmin' || profile.role === 'admin'
    const token = await generateToken(profile.id, isAdmin)

    const nameParts = (profile.full_name || '').trim().split(' ')
    const nom = nameParts[0] || ''
    const prenom = nameParts.slice(1).join(' ') || ''

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
        subscription_status: profile.subscription_status,
        is_active: true
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
