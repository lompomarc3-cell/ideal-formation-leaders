export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
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

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method === 'GET') {
    // Récupérer les prix depuis les catégories (prix distinct par type)
    const { data: cats } = await supabaseAdmin
      .from('categories')
      .select('type, prix')
      .eq('is_active', true)

    const prices = {
      direct: 5000,
      professionnel: 20000
    }

    if (cats) {
      for (const c of cats) {
        if (c.prix && c.type === 'direct') prices.direct = c.prix
        if (c.prix && c.type === 'professionnel') prices.professionnel = c.prix
      }
    }

    return res.json({ prices })
  }

  if (req.method === 'PUT') {
    const { type_concours, prix } = req.body
    if (!type_concours || !prix) return res.status(400).json({ error: 'Paramètres requis' })

    // Mettre à jour le prix dans toutes les catégories du type
    const { error } = await supabaseAdmin
      .from('categories')
      .update({ prix: parseInt(prix) })
      .eq('type', type_concours)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, message: `Prix mis à jour: ${prix} FCFA` })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
