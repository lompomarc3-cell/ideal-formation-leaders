export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken, hashPassword } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = await verifyToken(token)
  if (!decoded) return null
  const { data: user } = await supabaseAdmin
    .from('ifl_users')
    .select('id, is_admin, role')
    .eq('id', decoded.userId)
    .single()
  return (user?.is_admin || user?.role === 'admin') ? decoded.userId : null
}

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method === 'GET') {
    const { data: users, error } = await supabaseAdmin
      .from('ifl_users')
      .select('id, phone, nom, prenom, role, is_admin, is_active, abonnement_type, abonnement_valide_jusqua, created_at')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ users: users || [] })
  }

  if (req.method === 'PUT') {
    const { id, abonnement_type, abonnement_valide_jusqua, is_active, new_password } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    const updates = {}
    if (abonnement_type !== undefined) updates.abonnement_type = abonnement_type || null
    if (abonnement_valide_jusqua !== undefined) updates.abonnement_valide_jusqua = abonnement_valide_jusqua || null
    if (is_active !== undefined) updates.is_active = is_active
    if (new_password && new_password.length >= 6) {
      updates.password_hash = await hashPassword(new_password)
    }

    const { data, error } = await supabaseAdmin
      .from('ifl_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ user: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
