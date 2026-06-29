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
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Méthode non supportée' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const now = new Date().toISOString()

  // Récupérer les sessions actives (dans la période de validité)
  const { data: sessions, error } = await supabaseAdmin
    .from('special_sessions')
    .select('id, type, dossier_nom, duration_days, prix, start_date, end_date, label, description')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false })

  if (error) {
    // Table pas encore créée – retourner liste vide
    if (error.message && error.message.includes('does not exist')) {
      return new Response(JSON.stringify({ sessions: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  // Si un token est fourni, enrichir avec les souscriptions de l'utilisateur
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  let userSessions = []

  if (token) {
    const { data: userData } = await supabaseAdmin.auth.getUser(token)
    if (userData?.user) {
      const { data: uss } = await supabaseAdmin
        .from('user_special_sessions')
        .select('session_id, expires_at, is_active')
        .eq('user_id', userData.user.id)
        .gt('expires_at', now)
        .eq('is_active', true)
      userSessions = uss || []
    }
  }

  const result = (sessions || []).map(s => ({
    ...s,
    user_subscribed: userSessions.some(us => us.session_id === s.id)
  }))

  return new Response(JSON.stringify({ sessions: result }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
