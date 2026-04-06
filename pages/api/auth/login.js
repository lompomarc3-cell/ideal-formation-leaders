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
    // Chercher le profil
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (error || !profile) {
      return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' })
    }

    // Récupérer le password_hash (stocké dans correction_requests avec type 'auth')
    const { data: authRecord } = await supabaseAdmin
      .from('correction_requests')
      .select('message')
      .eq('user_id', profile.id)
      .eq('status', 'auth')
      .maybeSingle()

    let storedHash = null
    if (authRecord?.message) {
      try {
        const parsed = JSON.parse(authRecord.message)
        storedHash = parsed.password_hash
      } catch {
        storedHash = authRecord.message
      }
    }

    if (!storedHash) {
      return res.status(401).json({ error: 'Compte non configuré. Contactez l\'admin.' })
    }

    const valid = await verifyPassword(password, storedHash)
    if (!valid) {
      return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' })
    }

    const isAdmin = ['admin', 'superadmin'].includes(profile.role)
    const token = generateToken(profile.id, isAdmin)

    return res.json({
      success: true,
      token,
      user: {
        id: profile.id,
        phone: profile.phone,
        nom: profile.full_name?.split(' ')[0] || '',
        prenom: profile.full_name?.split(' ').slice(1).join(' ') || '',
        full_name: profile.full_name,
        role: profile.role,
        is_admin: isAdmin,
        abonnement_type: profile.subscription_type,
        abonnement_valide_jusqua: profile.subscription_expires_at,
        subscription_status: profile.subscription_status
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message })
  }
}
