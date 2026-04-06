import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const { data: p } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', decoded.userId)
    .single()
  return ['admin', 'superadmin'].includes(p?.role) ? decoded.userId : null
}

// Prix par défaut (utilise la colonne prix des catégories)
const DEFAULT_PRICES = [
  { id: 1, type_concours: 'direct', prix: 5000, description: 'Accès à tous les dossiers pour les concours directs' },
  { id: 2, type_concours: 'professionnel', prix: 20000, description: 'Accès complet aux concours professionnels' }
]

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  // GET - Récupérer les prix depuis les catégories
  if (req.method === 'GET') {
    try {
      // Prendre le prix de la première catégorie de chaque type
      const { data: directCat } = await supabaseAdmin
        .from('categories')
        .select('prix')
        .eq('type', 'direct')
        .limit(1)
        .single()

      const { data: proCat } = await supabaseAdmin
        .from('categories')
        .select('prix')
        .eq('type', 'professionnel')
        .limit(1)
        .single()

      const prices = [
        {
          id: 1,
          type_concours: 'direct',
          prix: directCat?.prix || 5000,
          description: 'Accès à tous les dossiers pour les concours directs'
        },
        {
          id: 2,
          type_concours: 'professionnel',
          prix: proCat?.prix || 20000,
          description: 'Accès complet aux concours professionnels'
        }
      ]

      return res.json({ prices })
    } catch {
      return res.json({ prices: DEFAULT_PRICES })
    }
  }

  // PUT - Mettre à jour le prix
  if (req.method === 'PUT') {
    const { type_concours, prix } = req.body
    if (!type_concours || !prix) return res.status(400).json({ error: 'Données requises' })

    const newPrix = parseInt(prix)
    if (isNaN(newPrix) || newPrix < 100) {
      return res.status(400).json({ error: 'Prix invalide (minimum 100 FCFA)' })
    }

    // Mettre à jour le prix dans toutes les catégories du même type
    const catType = type_concours === 'direct' ? 'direct' : 'professionnel'
    const { error } = await supabaseAdmin
      .from('categories')
      .update({ prix: newPrix })
      .eq('type', catType)

    if (error) return res.status(500).json({ error: error.message })

    return res.json({
      price: { type_concours, prix: newPrix },
      success: true,
      message: `Prix ${type_concours === 'direct' ? 'Concours Directs' : 'Concours Professionnels'} mis à jour: ${newPrix.toLocaleString()} FCFA`
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
