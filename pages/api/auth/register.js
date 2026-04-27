export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { hashPassword, generateToken } from '../../../lib/auth'
import { rateLimit, tooManyRequests } from '../../../lib/rate-limit'

const SUPABASE_URL = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  // 🛡️ Rate limit : 5 inscriptions / minute / IP, blocage 10 min si dépassé
  const rl = rateLimit(req, { key: 'register', max: 5, windowMs: 60_000, blockMs: 10 * 60_000 })
  if (!rl.allowed) return tooManyRequests(rl.resetIn)

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

    // 2. Créer un utilisateur dans Supabase Auth avec email fictif basé sur le téléphone
    const fakeEmail = `${normalizedPhone.replace('+', '')}@ifl-burkina.app`
    
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: fakeEmail,
        password: password,
        email_confirm: true,
        user_metadata: { full_name, nom: nom.toUpperCase().trim(), prenom: prenom.trim(), phone: normalizedPhone }
      })
    })

    const authData = await authResponse.json()

    let userId = null

    if (!authResponse.ok) {
      // Si l'email existe déjà dans Auth (re-inscription), chercher dans profiles
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle()
      
      if (existingProfile) {
        return new Response(JSON.stringify({ error: 'Ce numéro de téléphone est déjà enregistré.' }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return new Response(JSON.stringify({ error: 'Erreur création compte: ' + (authData.message || authData.msg || JSON.stringify(authData).substring(0, 100)) }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    userId = authData.id
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Erreur: impossible de récupérer l\'identifiant utilisateur.' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    // 3. Créer ou mettre à jour le profil
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
      }, { onConflict: 'id' })

    if (upsertError) {
      // Essayer un update
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ phone: normalizedPhone, full_name, role: 'user', subscription_status: 'free' })
        .eq('id', userId)
      if (updateError) {
        return new Response(JSON.stringify({ error: 'Erreur mise à jour profil: ' + updateError.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    // 4. Stocker le hash du mot de passe dans correction_requests
    await supabaseAdmin
      .from('correction_requests')
      .delete()
      .eq('user_id', userId)
      .like('message', '%ifl_auth%')

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
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + (error.message || String(error)) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
