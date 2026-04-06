import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Catégories publiques (pas besoin d'auth pour afficher)
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('type')
      .order('nom')

    if (error) throw error

    // Trier: direct d'abord, puis professionnel
    const direct = categories.filter(c => c.type === 'direct')
    const pro = categories.filter(c => c.type === 'professionnel')

    // Ordre spécifique pour les concours directs
    const ordresDirect = [
      'Actualité / Culture Générale',
      'Français',
      'Littérature et Art',
      'H-G (Histoire-Géographie)',
      'SVT (Sciences de la Vie et de la Terre)',
      'Psychotechniques',
      'Matchs',
      'PC (Physique-Chimie)',
      'Entraînement QCM',
      'Accompagnement Final'
    ]

    const ordresPro = [
      'Spécialités Vie Scolaire – CASU/AASU',
      'Spécialités CISU/AISU – ENAREF',
      'Inspectorat – IES/IEPENF',
      'Professeurs Agrégés',
      'CAPES – Toutes Options',
      'Administrateur des Hôpitaux',
      'Spécialités Santé',
      'Spécialités GSP (Gestion des Services Publics)',
      'Spécialités Police',
      'Administrateur Civil',
      'Entraînement QCM',
      'Accompagnement Final'
    ]

    const sortCats = (cats, ordre) => {
      return cats.sort((a, b) => {
        const ia = ordre.findIndex(n => a.nom.includes(n.split(' ')[0]))
        const ib = ordre.findIndex(n => b.nom.includes(n.split(' ')[0]))
        if (ia === -1 && ib === -1) return a.nom.localeCompare(b.nom)
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })
    }

    return res.json({
      categories: [...sortCats(direct, ordresDirect), ...sortCats(pro, ordresPro)]
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur: ' + error.message })
  }
}
