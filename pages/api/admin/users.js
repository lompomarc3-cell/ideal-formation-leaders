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
  // Helper pour compatibilité Edge Runtime
  let body = {}
  if (req.method !== 'GET') {
    try { body = await req.json() } catch {}
  }
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json'}})
  const res = {
    status: (s) => ({ json: (d) => R(d, s) }),
    json: (d) => R(d, 200)
  }
  const reqData = { body, method: req.method, query: {}, headers: req.headers }

  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method === 'GET') {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .not('role', 'in', '("superadmin","admin")')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return res.status(500).json({ error: error.message })

    return res.json({
      users: (users || []).map(u => {
        const [nom, ...prenomParts] = (u.full_name || '').split(' ')
        return {
          id: u.id,
          phone: u.phone,
          nom: nom || '',
          prenom: prenomParts.join(' ') || '',
          full_name: u.full_name,
          role: u.role,
          is_admin: false,
          abonnement_type: u.subscription_type,
          subscription_status: u.subscription_status,
          abonnement_valide_jusqua: u.subscription_expires_at,
          created_at: u.created_at
        }
      })
    })
  }

  if (req.method === 'PUT') {
    const { id, subscription_type, subscription_status, subscription_expires_at } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    const updateData = {}
    if (subscription_type !== undefined) updateData.subscription_type = subscription_type
    if (subscription_status !== undefined) updateData.subscription_status = subscription_status
    if (subscription_expires_at !== undefined) updateData.subscription_expires_at = subscription_expires_at

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
