export const runtime = 'experimental-edge'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non supportée' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }

  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  const supabaseAdmin = getSupabaseAdmin()

  // Vérifier l'utilisateur
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Token invalide' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }
  const userId = userData.user.id

  const body = await req.json()
  const { session_id } = body
  if (!session_id) return new Response(JSON.stringify({ error: 'session_id manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  // Récupérer la session
  const now = new Date()
  const { data: session, error: sessError } = await supabaseAdmin
    .from('special_sessions')
    .select('*')
    .eq('id', session_id)
    .eq('is_active', true)
    .single()

  if (sessError || !session) {
    return new Response(JSON.stringify({ error: 'Session introuvable ou inactive' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  // Vérifier la période
  if (new Date(session.end_date) < now) {
    return new Response(JSON.stringify({ error: 'Cette session est expirée' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  // Calculer la date d'expiration
  const expiresAt = new Date(now.getTime() + session.duration_days * 24 * 60 * 60 * 1000).toISOString()

  // Insérer la souscription
  const { data: uss, error: ussError } = await supabaseAdmin
    .from('user_special_sessions')
    .upsert([{ user_id: userId, session_id, expires_at: expiresAt, is_active: true }], { onConflict: 'user_id,session_id' })
    .select()
    .single()

  if (ussError) {
    return new Response(JSON.stringify({ error: ussError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  // Si session professionnelle, débloquer le dossier pour l'utilisateur
  if (session.type === 'professionnel' && session.dossier_nom) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('dossiers_debloques, subscription_type, subscription_status')
      .eq('id', userId)
      .single()

    if (profile) {
      const existing = profile.dossiers_debloques || []
      if (!existing.includes(session.dossier_nom)) {
        await supabaseAdmin
          .from('profiles')
          .update({
            dossiers_debloques: [...existing, session.dossier_nom],
            session_special_expires_at: expiresAt
          })
          .eq('id', userId)
      }
    }
  }

  // Si session directe, marquer l'accès
  if (session.type === 'direct') {
    await supabaseAdmin
      .from('profiles')
      .update({ session_direct_expires_at: expiresAt })
      .eq('id', userId)
  }

  return new Response(JSON.stringify({ success: true, expires_at: expiresAt, session: uss }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
