export const runtime = 'experimental-edge'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

/**
 * GET /api/sessions/public
 * Retourne les sessions spéciales actives (sans authentification)
 * Utilisé par l'app Flutter pour afficher les bannières d'offres
 */
export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Méthode non supportée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  const sb = getSupabase()
  const now = new Date().toISOString()

  try {
    // Récupérer les sessions actives dans la période de validité
    const { data: sessions, error } = await sb
      .from('special_sessions')
      .select('id, type, dossier_nom, duration_days, prix, start_date, end_date, label, description, is_active')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false })

    if (error) {
      // Table inexistante → retourner liste vide
      if (error.message && (error.message.includes('does not exist') || error.code === '42P01')) {
        return new Response(JSON.stringify({ sessions: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })
      }
      return new Response(JSON.stringify({ error: error.message, sessions: [] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // Vérifier si l'utilisateur est connecté (token optionnel)
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace('Bearer ', '').trim()
    let userSessions = []

    if (token) {
      try {
        const { data: userData } = await sb.auth.getUser(token)
        if (userData?.user) {
          const { data: uss } = await sb
            .from('user_special_sessions')
            .select('session_id, expires_at, is_active')
            .eq('user_id', userData.user.id)
            .gt('expires_at', now)
            .eq('is_active', true)
          userSessions = uss || []
        }
      } catch (_) {}
    }

    const result = (sessions || []).map(s => ({
      ...s,
      user_subscribed: userSessions.some(us => us.session_id === s.id)
    }))

    return new Response(JSON.stringify({ sessions: result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, sessions: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
