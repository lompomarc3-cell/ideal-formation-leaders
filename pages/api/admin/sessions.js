export const runtime = 'experimental-edge'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

async function verifyAdmin(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const sb = getSupabaseAdmin()
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data?.user) return null
  const { data: profile } = await sb.from('profiles').select('role').eq('id', data.user.id).single()
  if (!profile || profile.role !== 'superadmin') return null
  return data.user
}

export default async function handler(req) {
  const supabaseAdmin = getSupabaseAdmin()
  const method = req.method

  // GET – liste toutes les sessions
  if (method === 'GET') {
    const admin = await verifyAdmin(req)
    if (!admin) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const { data, error } = await supabaseAdmin
      .from('special_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ sessions: data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  // POST – créer une session
  if (method === 'POST') {
    const admin = await verifyAdmin(req)
    if (!admin) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const body = await req.json()
    const { type, dossier_nom, duration_days, prix, start_date, end_date, label, description } = body

    if (!type || !duration_days || prix === undefined || !start_date || !end_date) {
      return new Response(JSON.stringify({ error: 'Champs obligatoires manquants' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (type === 'professionnel' && !dossier_nom) {
      return new Response(JSON.stringify({ error: 'Le dossier est obligatoire pour une session professionnelle' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const { data, error } = await supabaseAdmin
      .from('special_sessions')
      .insert([{ type, dossier_nom: type === 'professionnel' ? dossier_nom : null, duration_days, prix, start_date, end_date, label, description, created_by: admin.id }])
      .select()
      .single()

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ session: data }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  }

  // PUT – modifier une session
  if (method === 'PUT') {
    const admin = await verifyAdmin(req)
    if (!admin) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const body = await req.json()
    const { id, type, dossier_nom, duration_days, prix, start_date, end_date, is_active, label, description } = body

    if (!id) return new Response(JSON.stringify({ error: 'ID manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const updates = {}
    if (type !== undefined) updates.type = type
    if (dossier_nom !== undefined) updates.dossier_nom = dossier_nom
    if (duration_days !== undefined) updates.duration_days = duration_days
    if (prix !== undefined) updates.prix = prix
    if (start_date !== undefined) updates.start_date = start_date
    if (end_date !== undefined) updates.end_date = end_date
    if (is_active !== undefined) updates.is_active = is_active
    if (label !== undefined) updates.label = label
    if (description !== undefined) updates.description = description
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('special_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ session: data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  // DELETE – supprimer une session
  if (method === 'DELETE') {
    const admin = await verifyAdmin(req)
    if (!admin) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return new Response(JSON.stringify({ error: 'ID manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const { error } = await supabaseAdmin.from('special_sessions').delete().eq('id', id)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ error: 'Méthode non supportée' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
}
