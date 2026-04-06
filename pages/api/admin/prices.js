export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

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
    const { data, error } = await supabaseAdmin
      .from('ifl_prix_config')
      .select('*')
      .order('id')

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ prices: data || [] })
  }

  if (req.method === 'PUT') {
    const { type_concours, prix } = req.body
    if (!type_concours || !prix) return res.status(400).json({ error: 'Paramètres manquants' })

    const { data, error } = await supabaseAdmin
      .from('ifl_prix_config')
      .upsert({ type_concours, prix: parseInt(prix) }, { onConflict: 'type_concours' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ price: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
