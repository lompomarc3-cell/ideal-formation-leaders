import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const { data: p } = await supabaseAdmin.from('profiles').select('role').eq('id', decoded.userId).single()
  return ['admin', 'superadmin'].includes(p?.role) ? decoded.userId : null
}

// Prix stockés dans les categories (champ prix)
export default async function handler(req, res) {
  // GET - Prix actuels depuis les categories
  if (req.method === 'GET') {
    const adminId = await checkAdmin(req)
    if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

    // Récupérer les prix uniques par type
    const { data: cats, error } = await supabaseAdmin
      .from('categories')
      .select('type, prix')
      .eq('is_active', true)

    if (error) return res.status(500).json({ error: error.message })

    const directPrix = cats?.find(c => c.type === 'direct')?.prix || 5000
    const proPrix = cats?.find(c => c.type === 'professionnel')?.prix || 20000

    return res.json({
      prices: [
        { id: 1, type_concours: 'direct', prix: directPrix, description: 'Concours Directs – 10 dossiers' },
        { id: 2, type_concours: 'professionnel', prix: proPrix, description: 'Concours Professionnels – 12 dossiers' }
      ]
    })
  }

  // PUT - Modifier les prix (dans toutes les catégories du type)
  if (req.method === 'PUT') {
    const adminId = await checkAdmin(req)
    if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

    const { type_concours, prix } = req.body
    if (!type_concours || !prix) return res.status(400).json({ error: 'Paramètres manquants' })

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({ prix: parseInt(prix) })
      .eq('type', type_concours)
      .select()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ price: { type_concours, prix: parseInt(prix) }, updated: data?.length })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
