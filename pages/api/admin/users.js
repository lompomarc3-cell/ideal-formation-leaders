export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const decoded = await verifyToken(token)
  if (!decoded) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', decoded.userId)
    .single()
  return (profile?.role === 'superadmin' || profile?.role === 'admin') ? decoded.userId : null
}

export default async function handler(req) {
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json'}})
  const res = {
    status: (s) => ({ json: (d) => R(d, s) }),
    json: (d) => R(d, 200)
  }
  let body = {}
  if (req.method !== 'GET') {
    try { body = await req.json() } catch {}
  }

  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method === 'GET') {
    // Récupérer tous les utilisateurs non-admin
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return res.status(500).json({ error: error.message })

    return res.json({
      users: (users || []).map(u => {
        const parts = (u.full_name || '').trim().split(' ')
        const nom = parts[0] || ''
        const prenom = parts.slice(1).join(' ') || ''
        const isAdmin = u.role === 'superadmin' || u.role === 'admin'
        return {
          id: u.id,
          phone: u.phone,
          nom,
          prenom,
          full_name: u.full_name,
          role: u.role,
          is_admin: isAdmin,
          abonnement_type: u.subscription_type,
          subscription_status: u.subscription_status,
          abonnement_valide_jusqua: u.subscription_expires_at,
          is_active: true,
          created_at: u.created_at
        }
      })
    })
  }

  if (req.method === 'PUT') {
    const { id, abonnement_type, abonnement_valide_jusqua, is_active } = body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    const updateData = {}
    if (abonnement_type !== undefined) {
      updateData.subscription_type = abonnement_type || null
      updateData.subscription_status = abonnement_type ? 'active' : 'free'
    }
    if (abonnement_valide_jusqua !== undefined) updateData.subscription_expires_at = abonnement_valide_jusqua

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    const parts = (data?.full_name || '').trim().split(' ')
    return res.json({
      user: {
        id: data.id,
        nom: parts[0] || '',
        prenom: parts.slice(1).join(' ') || '',
        phone: data.phone,
        abonnement_type: data.subscription_type,
        subscription_status: data.subscription_status,
        abonnement_valide_jusqua: data.subscription_expires_at
      }
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
