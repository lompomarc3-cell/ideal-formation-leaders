export const runtime = 'edge'
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
    // 1. Vérifier si le téléphone est déjà enregistré dans profiles
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

    // 2. Créer l'utilisateur via Supabase Auth Admin API
    // Ceci crée automatiquement un profil dans la table profiles via trigger
    const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

    // Numéro sans +226 pour Supabase Auth (il stocke sans +)
    const phoneForAuth = normalizedPhone.replace('+', '')

    const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneForAuth,
        password: password, // mot de passe Supabase Auth (optionnel, on a notre propre hash)
        phone_confirm: true,
        user_metadata: {
          full_name,
          nom: nom.toUpperCase().trim(),
          prenom: prenom.trim()
        }
      })
    })

    if (!authResponse.ok) {
      const authError = await authResponse.json()
      // Si l'utilisateur Auth existe déjà mais pas dans profiles
      if (authError.code === 'phone_exists' || authError.msg?.includes('already registered') || authResponse.status === 422) {
        // Chercher l'utilisateur existant dans auth
        const listResp = await fetch(`${supabaseUrl}/auth/v1/admin/users?filter=${phoneForAuth}`, {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          }
        })
        if (listResp.ok) {
          const listData = await listResp.json()
          const existingUser = listData.users?.find(u => u.phone === phoneForAuth)
          if (existingUser) {
            return res.status(400).json({ error: 'Ce numéro de téléphone est déjà enregistré.' })
          }
        }
        return res.status(400).json({ error: 'Ce numéro est déjà utilisé. Veuillez vous connecter.' })
      }
      return res.status(400).json({ error: 'Erreur création compte: ' + (authError.message || authError.msg || JSON.stringify(authError)) })
    }

    const authUser = await authResponse.json()
    const userId = authUser.id

    if (!userId) {
      return res.status(500).json({ error: 'Erreur: impossible de récupérer l\'identifiant utilisateur.' })
    }

    // 3. Mettre à jour le profil créé automatiquement par le trigger
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone: normalizedPhone,
        full_name,
        role: 'user',
        subscription_status: 'free',
        subscription_type: null,
        subscription_expires_at: null
      })
      .eq('id', userId)

    if (updateError) {
      // Si la mise à jour échoue, essayer un upsert
      const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          phone: normalizedPhone,
          full_name,
          role: 'user',
          subscription_status: 'free',
          subscription_type: null,
          subscription_expires_at: null
        })

      if (upsertError) {
        return res.status(400).json({ error: 'Erreur mise à jour profil: ' + upsertError.message })
      }
    }

    // 4. Stocker le hash du mot de passe dans correction_requests
    await supabaseAdmin
      .from('correction_requests')
      .insert({
        user_id: userId,
        question_id: null,
        message: JSON.stringify({
          type: 'ifl_auth',
          password_hash,
          nom: nom.toUpperCase().trim(),
          prenom: prenom.trim()
        }),
        status: 'pending',
        admin_response: null
      })

    // 5. Générer le token JWT IFL
    const token = await generateToken(userId, false)

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        phone: normalizedPhone,
        nom: nom.toUpperCase().trim(),
        prenom: prenom.trim(),
        full_name,
        role: 'user',
        is_admin: false,
        abonnement_type: null,
        abonnement_valide_jusqua: null,
        subscription_status: 'free',
        is_active: true
      }
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message })
  }
}
