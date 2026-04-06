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
    const { data: user, error } = await supabaseAdmin
      .from('ifl_users')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !user) {
      return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' })
    }

    const token = generateToken(user.id, user.is_admin)

    return res.json({
      success: true,
      token,
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
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message })
  }
}
