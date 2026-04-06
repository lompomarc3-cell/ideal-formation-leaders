import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  // GET - Récupérer les catégories (accessible public pour afficher les offres)
  if (req.method === 'GET') {
    const { type } = req.query

    let query = supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('nom', { ascending: true })

    if (type) query = query.eq('type', type)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    // Mapper pour compatibilité
    const categories = (data || []).map(c => ({
      ...c,
      type_concours: c.type
    }))

    return res.json({ categories })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
