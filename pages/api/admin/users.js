import { supabaseAdmin } from '../../../lib/supabase'
import { getUserFromToken, hashPassword } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  return user?.is_admin ? user : null
}

export default async function handler(req, res) {
  const admin = await checkAdmin(req)
  if (!admin) return res.status(403).json({ error: 'Accès admin requis' })

  if (req.method === 'GET') {
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    const { data: users, error, count } = await supabaseAdmin
      .from('ifl_users')
      .select('id, phone, nom, prenom, role, is_admin, abonnement_type, abonnement_valide_jusqua, is_active, created_at', { count: 'exact' })
      .eq('is_admin', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ users, total: count })
  }

  if (req.method === 'PUT') {
    const { id, abonnement_type, abonnement_valide_jusqua, is_active, password } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    const updates = {}
    if (abonnement_type !== undefined) updates.abonnement_type = abonnement_type
    if (abonnement_valide_jusqua !== undefined) updates.abonnement_valide_jusqua = abonnement_valide_jusqua
    if (is_active !== undefined) updates.is_active = is_active
    if (password) updates.password_hash = await hashPassword(password)

    const { data, error } = await supabaseAdmin
      .from('ifl_users')
      .update(updates)
      .eq('id', id)
      .select('id, phone, nom, prenom, abonnement_type, abonnement_valide_jusqua, is_active')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ user: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
