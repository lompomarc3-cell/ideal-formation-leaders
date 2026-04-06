import { supabaseAdmin } from '../../../lib/supabase'
import { getUserFromToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  return user?.is_admin ? user : null
}

export default async function handler(req, res) {
  const admin = await checkAdmin(req)
  if (!admin) return res.status(403).json({ error: 'Accès admin requis' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('ifl_prix_config')
      .select('*')
      .order('id')

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ prices: data })
  }

  if (req.method === 'PUT') {
    const { type_concours, prix } = req.body
    if (!type_concours || !prix) return res.status(400).json({ error: 'Champs requis' })

    const { data, error } = await supabaseAdmin
      .from('ifl_prix_config')
      .upsert({ type_concours, prix }, { onConflict: 'type_concours' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ price: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
