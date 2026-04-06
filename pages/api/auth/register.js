import { supabaseAdmin } from '../../../lib/supabase'
import { hashPassword, generateToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { phone, nom, prenom, password } = req.body

  if (!phone || !nom || !prenom || !password) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' })
  }

  let normalizedPhone = phone.trim().replace(/\s/g, '')
  if (!normalizedPhone.startsWith('+226')) {
    normalizedPhone = '+226' + normalizedPhone.replace(/^0+/, '')
  }
  if (normalizedPhone.length < 12) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide. Format: +226XXXXXXXX' })
  }

  try {
    // Vérifier si déjà existant
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (existing) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà enregistré.' })
    }

    const full_name = `${nom.toUpperCase().trim()} ${prenom.trim()}`
    const password_hash = await hashPassword(password)

    // Créer le profil
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        phone: normalizedPhone,
        full_name,
        role: 'user',
        subscription_status: 'free',
        subscription_type: null,
        subscription_expires_at: null
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: 'Erreur lors de la création du compte: ' + error.message })
    }

    // Stocker le password_hash dans correction_requests
    await supabaseAdmin.from('correction_requests').insert({
      user_id: profile.id,
      question_id: null,
      message: JSON.stringify({
        password_hash,
        nom: nom.toUpperCase().trim(),
        prenom: prenom.trim(),
        type: 'auth'
      }),
      status: 'auth',
      admin_response: 'password_storage'
    })

    const isAdmin = ['admin', 'superadmin'].includes(profile.role)
    const token = generateToken(profile.id, isAdmin)

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: profile.id,
        phone: profile.phone,
        nom: nom.toUpperCase().trim(),
        prenom: prenom.trim(),
        full_name: profile.full_name,
        role: profile.role,
        is_admin: isAdmin,
        abonnement_type: null,
        abonnement_valide_jusqua: null,
        subscription_status: 'free'
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({ error: 'Erreur serveur. Veuillez réessayer.' })
  }
}
