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
    // 1. Vérifier si le téléphone est déjà enregistré
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

    // 2. Créer l'utilisateur via Supabase Auth Admin API
    const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'
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
        password: password,
        phone_confirm: true,
        user_metadata: { full_name, nom: nom.toUpperCase().trim(), prenom: prenom.trim() }
      })
    })

    if (!authResponse.ok) {
      const authError = await authResponse.json()
      if (authError.code === 'phone_exists' || authResponse.status === 422) {
        return new Response(JSON.stringify({ error: 'Ce numéro de téléphone est déjà enregistré.' }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ error: 'Erreur création compte: ' + (authError.message || authError.msg || JSON.stringify(authError)) }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const authUser = await authResponse.json()
    const userId = authUser.id

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Erreur: impossible de récupérer l\'identifiant utilisateur.' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    // 3. Upsert le profil
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
      return new Response(JSON.stringify({ error: 'Erreur mise à jour profil: ' + upsertError.message }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // 4. Stocker le hash du mot de passe
    await supabaseAdmin
      .from('correction_requests')
      .insert({
        user_id: userId,
        question_id: null,
        message: JSON.stringify({ type: 'ifl_auth', password_hash, nom: nom.toUpperCase().trim(), prenom: prenom.trim() }),
        status: 'pending',
        admin_response: null
      })

    // 5. Générer le token JWT
    const token = await generateToken(userId, false)

    return new Response(JSON.stringify({
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
    }), { status: 201, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
