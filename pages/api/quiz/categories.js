export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req) {
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json'}})
  const res = {
    status: (s) => ({ json: (d) => R(d, s) }),
    json: (d) => R(d, 200)
  }

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  if (req.method === 'GET') {
    // Edge runtime: utiliser URL pour les query params
    const url = new URL(req.url)
    const type = url.searchParams.get('type')

    let query = supabaseAdmin
      .from('categories')
      .select('id, nom, type, description, question_count, is_active, ordre')
      .eq('is_active', true)

    if (type) query = query.eq('type', type)
    
    // Tri par ordre si disponible, sinon par nom
    query = query.order('nom', { ascending: true })

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    const categories = (data || []).map(c => ({
      id: c.id,
      nom: c.nom,
      type_concours: c.type,
      description: c.description,
      question_count: c.question_count || 0,
      ordre: c.ordre || 0,
      icone: getIcone(c.nom, c.type)
    }))

    // Tri par ordre si la colonne existe
    categories.sort((a, b) => (a.ordre || 999) - (b.ordre || 999) || a.nom.localeCompare(b.nom))

    return res.json({ categories })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

function getIcone(nom, type) {
  const n = (nom || '').toLowerCase()
  if (n.includes('actualit') || n.includes('culture')) return '🌍'
  if (n.includes('français') || n.includes('franc')) return '📚'
  if (n.includes('littérat') || n.includes('art')) return '🎨'
  if (n.includes('histoire') || n.includes('géograph') || n.includes('h-g')) return '🗺️'
  if (n.includes('svt') || n.includes('science')) return '🧬'
  if (n.includes('psycho')) return '🧠'
  if (n.includes('math') || n.includes('match')) return '📐'
  if (n.includes('physique') || n.includes('chimie') || n.includes('pc')) return '⚗️'
  if (n.includes('entraîn') || n.includes('qcm')) return '✏️'
  if (n.includes('accompagn') || n.includes('final')) return '🎯'
  if (n.includes('vie scolaire') || n.includes('casu')) return '🏫'
  if (n.includes('cisu') || n.includes('enaref') || n.includes('aisu')) return '🏛️'
  if (n.includes('inspect') || n.includes('ies') || n.includes('iepn')) return '🔍'
  if (n.includes('agrég')) return '🎓'
  if (n.includes('capes')) return '📖'
  if (n.includes('hôpital') || n.includes('hopital')) return '🏥'
  if (n.includes('santé') || n.includes('sante')) return '💊'
  if (n.includes('gsp')) return '🛡️'
  if (n.includes('police')) return '👮'
  if (n.includes('civil') || n.includes('admin')) return '📋'
  return type === 'direct' ? '📚' : '🎓'
}
