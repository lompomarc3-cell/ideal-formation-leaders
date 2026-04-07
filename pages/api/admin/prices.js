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

  // Les prix sont publics pour les utilisateurs connectés, mais la modification nécessite admin
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })
  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  if (req.method === 'GET') {
    // Récupérer les prix configurés (premier prix trouvé par type)
    const { data: cats } = await supabaseAdmin
      .from('categories')
      .select('type, prix')
      .eq('is_active', true)

    const priceMap = { direct: 5000, professionnel: 20000 }
    if (cats) {
      for (const c of cats) {
        if (c.prix) {
          if (c.type === 'direct') priceMap.direct = c.prix
          if (c.type === 'professionnel') priceMap.professionnel = c.prix
        }
      }
    }

    // Format attendu par le frontend
    return res.json({
      prices: [
        { id: 1, type_concours: 'direct', prix: priceMap.direct, description: 'Concours Directs' },
        { id: 2, type_concours: 'professionnel', prix: priceMap.professionnel, description: 'Concours Professionnels' }
      ]
    })
  }

  if (req.method === 'PUT') {
    // Seul l'admin peut modifier les prix
    const adminId = await checkAdmin(req)
    if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

    const { type_concours, prix } = body
    if (!type_concours || !prix) return res.status(400).json({ error: 'Paramètres requis' })

    const { error } = await supabaseAdmin
      .from('categories')
      .update({ prix: parseInt(prix) })
      .eq('type', type_concours)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, message: `✅ Prix mis à jour: ${parseInt(prix).toLocaleString()} FCFA` })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
