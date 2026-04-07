export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { hashPassword, generateToken } from '../../../lib/auth'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  let body = {}
  try { body = await req.json() } catch {}
  const { phone, nom, prenom, password } = body

  if (!phone || !nom || !prenom || !password) {
    return new Response(JSON.stringify({ error: 'Tous les champs sont obligatoires.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  if (password.length < 6) {
    return new Response(JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  let normalizedPhone = phone.trim().replace(/\s/g, '')
  if (!normalizedPhone.startsWith('+226')) {
    normalizedPhone = '+226' + normalizedPhone.replace(/^0+/, '')
  }

  if (normalizedPhone.length < 12) {
    return new Response(JSON.stringify({ error: 'Numéro de téléphone invalide. Format: +226XXXXXXXX' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // 1. Vérifier si le téléphone est déjà enregistré dans profiles
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ error: 'Ce numéro de téléphone est déjà enregistré.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const full_name = `${nom.toUpperCase().trim()} ${prenom.trim()}`
    const password_hash = await hashPassword(password)

    const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

    // 2. Créer l'utilisateur via Supabase Auth Admin API
    const phoneDigits = normalizedPhone.replace('+', '')
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneDigits,
        password: password,
        phone_confirm: true,
        user_metadata: { full_name, nom: nom.toUpperCase().trim(), prenom: prenom.trim() }
      })
    })

    const authData = await authResponse.json()

    // Gérer les erreurs auth
    if (!authResponse.ok) {
      // Téléphone déjà utilisé dans auth ?
      if (authData.code === 'phone_exists' || authResponse.status === 422 ||
          (authData.message && authData.message.includes('already been registered'))) {
        // L'utilisateur existe dans auth mais pas dans profiles → récupérer son id
        const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?phone=${encodeURIComponent(phoneDigits)}`, {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          }
        })
        const listData = await listResponse.json()
        const existingAuthUser = listData.users?.find(u => u.phone === phoneDigits)
        if (!existingAuthUser) {
          return new Response(JSON.stringify({ error: 'Ce numéro de téléphone est déjà enregistré.' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          })
        }
        // Utiliser l'ID existant pour créer le profil
        const userId = existingAuthUser.id
        await createProfileAndToken(supabaseAdmin, userId, normalizedPhone, full_name, nom, prenom, password_hash)
        const token = await generateToken(userId, false)
        return new Response(JSON.stringify({
          success: true, token,
          user: buildUserObj(userId, normalizedPhone, nom, prenom, full_name, false)
        }), { status: 201, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ error: 'Erreur création compte: ' + (authData.message || authData.msg || JSON.stringify(authData)) }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const userId = authData.id
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Erreur: impossible de récupérer l\'identifiant utilisateur.' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    // 3. Créer le profil et stocker le hash
    const profileError = await createProfileAndToken(supabaseAdmin, userId, normalizedPhone, full_name, nom, prenom, password_hash)
    if (profileError) {
      return new Response(JSON.stringify({ error: 'Erreur mise à jour profil: ' + profileError }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // 4. Générer le token JWT
    const token = await generateToken(userId, false)

    return new Response(JSON.stringify({
      success: true,
      token,
      user: buildUserObj(userId, normalizedPhone, nom, prenom, full_name, false)
    }), { status: 201, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + (error.message || String(error)) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function createProfileAndToken(supabaseAdmin, userId, phone, full_name, nom, prenom, password_hash) {
  // Upsert profil (gère le cas où le trigger Supabase l'a déjà créé)
  const { error: upsertError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      phone,
      full_name,
      role: 'user',
      subscription_status: 'free',
      subscription_type: null,
      subscription_expires_at: null
    }, { onConflict: 'id' })

  if (upsertError) {
    // Essayer un update si l'upsert échoue
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ phone, full_name, role: 'user', subscription_status: 'free' })
      .eq('id', userId)
    if (updateError) return updateError.message
  }

  // Stocker le hash du mot de passe dans correction_requests
  // Supprimer les anciens enregistrements ifl_auth pour cet utilisateur d'abord
  await supabaseAdmin
    .from('correction_requests')
    .delete()
    .eq('user_id', userId)
    .filter('message', 'like', '%ifl_auth%')

  await supabaseAdmin
    .from('correction_requests')
    .insert({
      user_id: userId,
      question_id: null,
      message: JSON.stringify({ type: 'ifl_auth', password_hash, nom: nom.toUpperCase().trim(), prenom: prenom.trim() }),
      status: 'pending',
      admin_response: null
    })

  return null
}

function buildUserObj(userId, phone, nom, prenom, full_name, is_admin) {
  return {
    id: userId,
    phone,
    nom: nom.toUpperCase().trim(),
    prenom: prenom.trim(),
    full_name,
    role: is_admin ? 'superadmin' : 'user',
    is_admin,
    abonnement_type: null,
    abonnement_valide_jusqua: null,
    subscription_status: 'free',
    is_active: true
  }
}
