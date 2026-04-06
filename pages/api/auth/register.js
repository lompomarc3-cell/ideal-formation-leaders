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

  // Normaliser le téléphone
  let normalizedPhone = phone.trim().replace(/\s/g, '')
  if (!normalizedPhone.startsWith('+226')) {
    normalizedPhone = '+226' + normalizedPhone.replace(/^0+/, '')
  }

  // Vérifier que c'est un numéro burkinabè valide
  if (normalizedPhone.length < 12) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide. Format: +226XXXXXXXX' })
  }

  try {
    // Vérifier si déjà existant
    const { data: existing } = await supabaseAdmin
      .from('ifl_users')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (existing) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà enregistré.' })
    }

    const password_hash = await hashPassword(password)

    const { data: user, error } = await supabaseAdmin
      .from('ifl_users')
      .insert({
        phone: normalizedPhone,
        nom: nom.toUpperCase().trim(),
        prenom: prenom.trim(),
        password_hash,
        role: 'user',
        is_admin: false,
        is_active: true
      })
      .select('id, phone, nom, prenom, role, is_admin, abonnement_type, abonnement_valide_jusqua, created_at')
      .single()

    if (error) {
      return res.status(400).json({ error: 'Erreur lors de la création du compte. ' + error.message })
    }

    const token = generateToken(user.id, user.is_admin)

    return res.status(201).json({
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
