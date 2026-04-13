export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', payload.userId)
    .maybeSingle()
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) return null
  return profile.id
}

export default async function handler(req) {
  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  // GET: liste des utilisateurs non admin
  if (req.method === 'GET') {
    try {
      const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone, role, subscription_type, subscription_status, subscription_expires_at, created_at')
        .not('role', 'in', '("admin","superadmin")')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const userList = (users || []).map(u => {
        const nameParts = (u.full_name || '').trim().split(' ')
        // Décoder le subscription_type (ex: 'professionnel:Magistrature')
        let abonnementType = u.subscription_type
        let dossierPrincipal = null
        if (u.subscription_type && u.subscription_type.startsWith('professionnel:')) {
          abonnementType = 'professionnel'
          dossierPrincipal = u.subscription_type.substring('professionnel:'.length)
        }
        return {
          id: u.id,
          nom: nameParts[0] || '',
          prenom: nameParts.slice(1).join(' ') || '',
          full_name: u.full_name,
          phone: u.phone,
          role: u.role,
          is_admin: false,
          abonnement_type: abonnementType,
          dossier_principal: dossierPrincipal,
          subscription_type_raw: u.subscription_type,
          subscription_status: u.subscription_status,
          abonnement_valide_jusqua: u.subscription_expires_at,
          subscription_expires_at: u.subscription_expires_at,
          created_at: u.created_at
        }
      })

      return new Response(JSON.stringify({ users: userList }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // PUT: modifier un utilisateur
  if (req.method === 'PUT') {
    let body = {}
    try { body = await req.json() } catch {}
    const { id, subscription_type, subscription_status, subscription_expires_at, dossier_principal } = body

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID utilisateur manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const updates = {}
      
      // Calculer le subscription_type correct en tenant compte du dossier_principal
      if (subscription_type !== undefined) {
        if (subscription_type === 'professionnel' && dossier_principal) {
          updates.subscription_type = `professionnel:${dossier_principal}`
        } else {
          updates.subscription_type = subscription_type || null
        }
      }
      if (subscription_status !== undefined) updates.subscription_status = subscription_status
      if (subscription_expires_at !== undefined) updates.subscription_expires_at = subscription_expires_at

      const { data: updated, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ user: updated, success: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
}
