export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyPassword, generateToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { phone, password } = req.body
  if (!phone || !password) {
    return res.status(400).json({ error: 'Téléphone et mot de passe requis.' })
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
      return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' })
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
        // Format JSON {type: 'ifl_auth', password_hash: '...'}
        try {
          const parsed = JSON.parse(record.message)
          if (parsed.type === 'ifl_auth' && parsed.password_hash) {
            passwordHash = parsed.password_hash
            break
          }
        } catch {}
        // Format sha256 dans admin_response (legacy)
        if (!passwordHash && record.admin_response && record.admin_response.startsWith('sha256:')) {
          passwordHash = record.admin_response
          break
        }
      }
    }

    if (!passwordHash) {
      return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' })
    }

    const valid = await verifyPassword(password, passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' })
    }

    const isAdmin = profile.role === 'superadmin' || profile.role === 'admin'
    const token = await generateToken(profile.id, isAdmin)

    const nameParts = (profile.full_name || '').trim().split(' ')
    const nom = nameParts[0] || ''
    const prenom = nameParts.slice(1).join(' ') || ''

    return res.json({
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
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message })
  }
}
