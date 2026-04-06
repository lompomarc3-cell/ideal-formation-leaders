import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', decoded.userId).single()
  if (!['admin', 'superadmin'].includes(profile?.role)) return null
  return decoded.userId
}

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method === 'GET') {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ users: users || [] })
  }

  if (req.method === 'PUT') {
    const { id, subscription_type, subscription_expires_at, subscription_status, role } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    const updates = {}
    if (subscription_type !== undefined) updates.subscription_type = subscription_type || null
    if (subscription_expires_at !== undefined) updates.subscription_expires_at = subscription_expires_at || null
    if (subscription_status !== undefined) updates.subscription_status = subscription_status
    if (role !== undefined) updates.role = role

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ user: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
