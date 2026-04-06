export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  if (req.method === 'GET') {
    const { type } = req.query

    let query = supabaseAdmin
      .from('categories')
      .select('id, nom, type, description, question_count, is_active')
      .eq('is_active', true)
      .order('nom')

    if (type) query = query.eq('type', type)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    const categories = (data || []).map(c => ({
      id: c.id,
      nom: c.nom,
      type_concours: c.type,
      description: c.description,
      question_count: c.question_count || 0,
      icone: getIcone(c.nom, c.type)
    }))

    return res.json({ categories })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

function getIcone(nom, type) {
  const mapping = {
    'Actualité': '🌍', 'Culture générale': '🌍', 'Culture Générale': '🌍',
    'Français': '📚', 'Littérature': '🎨', 'Histoire': '🗺️', 'Géographie': '🗺️',
    'SVT': '🧬', 'Psychotechniques': '🧠', 'Maths': '📐', 'Physique': '⚗️',
    'Chimie': '⚗️', 'Entraînement': '✏️', 'Accompagnement': '🎯',
    'Vie scolaire': '🏫', 'CASU': '🏫', 'CISU': '🏛️', 'ENAREF': '🏛️',
    'Inspectorat': '🔍', 'Agrégés': '🎓', 'CAPES': '📖',
    'hôpitaux': '🏥', 'santé': '💊', 'GSP': '🛡️', 'police': '👮',
    'civil': '📋', 'Administrateur': '📋'
  }
  for (const [key, icon] of Object.entries(mapping)) {
    if (nom.toLowerCase().includes(key.toLowerCase())) return icon
  }
  return type === 'direct' ? '📚' : '🎓'
}
