export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'
// Mapping direct: nom partiel → ordre officiel
const ORDRE_MAP = {
  direct: [
    { match: 'actualit', ordre: 1 },
    { match: 'fran', ordre: 2 },
    { match: 'litt', ordre: 3 },
    { match: 'h-g', ordre: 4 },
    { match: 'histoir', ordre: 4 },
    { match: 'svt', ordre: 5 },
    { match: 'psycho', ordre: 6 },
    { match: 'math', ordre: 7 },
    { match: 'physique', ordre: 8 },
    { match: 'pc (', ordre: 8 },
    { match: 'droit', ordre: 9 },
    { match: 'conomie', ordre: 10 },
    { match: 'entra', ordre: 11 },
    { match: 'accomp', ordre: 12 },
  ],
  professionnel: [
    { match: 'vie scolaire', ordre: 1 },
    { match: 'casu', ordre: 1 },
    { match: 'actualit', ordre: 2 },
    { match: 'cisu', ordre: 3 },
    { match: 'inspectorat : ies', ordre: 4 },
    { match: ' ies', ordre: 4 },
    { match: 'iepenf', ordre: 5 },
    { match: 'csap', ordre: 6 },
    { match: 'agrég', ordre: 7 },
    { match: 'agr', ordre: 7 },
    { match: 'capes', ordre: 8 },
    { match: 'h\u00f4pital', ordre: 9 },
    { match: 'hopital', ordre: 9 },
    { match: 'administrateur des h', ordre: 9 },
    { match: 'sant', ordre: 10 },
    { match: 'justice', ordre: 11 },
    { match: 'magistr', ordre: 12 },
    { match: 'gsp', ordre: 13 },
    { match: 'police', ordre: 14 },
    { match: 'civil', ordre: 15 },
    { match: 'entra', ordre: 16 },
    { match: 'accomp', ordre: 17 },
  ]
}

function getCatOrdre(nom, catType) {
  const n = (nom || '').toLowerCase()
  const mapList = ORDRE_MAP[catType] || []
  // Chercher la correspondance la plus longue en premier (pour éviter les conflits)
  const sorted = [...mapList].sort((a, b) => b.match.length - a.match.length)
  for (const entry of sorted) {
    if (n.includes(entry.match.toLowerCase())) {
      return entry.ordre
    }
  }
  return 99
}

function getCatIcon(nom, catType) {
  const n = (nom || '').toLowerCase()
  if (n.includes('culture') || n.includes('actualit')) return '🌍'
  if (n.includes('français') || n.includes('franc')) return '📚'
  if (n.includes('littérature') || n.includes('art')) return '🎨'
  if (n.includes('histoire') || n.includes('géographie') || n.includes('h-g')) return '🗺️'
  if (n.includes('svt') || n.includes('science')) return '🧬'
  if (n.includes('psycho')) return '🧠'
  if (n.includes('math')) return '📐'
  if (n.includes('physique') || n.includes('chimie') || n.includes('pc (')) return '⚗️'
  if (n.includes('droit')) return '⚖️'
  if (n.includes('conomie')) return '💹'
  if (n.includes('qcm') || n.includes('entraîn') || n.includes('entra')) return '✏️'
  if (n.includes('accompagn') || n.includes('final')) return '🎯'
  if (n.includes('vie scolaire') || n.includes('casu')) return '🏫'
  if (n.includes('cisu') || n.includes('enaref')) return '🏛️'
  if (n.includes('iepenf')) return '🔎'
  if (n.includes('inspect') || n.includes('ies')) return '🔍'
  if (n.includes('csap')) return '🎓'
  if (n.includes('agrég') || n.includes('agr')) return '📜'
  if (n.includes('capes')) return '📖'
  if (n.includes('hôpital') || n.includes('hopital') || n.includes('pital')) return '🏥'
  if (n.includes('santé') || n.includes('sant')) return '💊'
  if (n.includes('justice')) return '⚖️'
  if (n.includes('magistr')) return '👨‍⚖️'
  if (n.includes('gsp')) return '🛡️'
  if (n.includes('police')) return '👮'
  if (n.includes('civil') || n.includes('admin')) return '📋'
  return catType === 'direct' ? '📚' : '🎓'
}

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  // Vérifier l'authentification (optionnelle pour les catégories)
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')

  // Si pas de token, utiliser l'API publique (renvoyer les catégories quand même)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token requis', redirect: '/api/quiz/public-categories' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Token invalide' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')

    let query = supabaseAdmin
      .from('categories')
      .select('id, nom, type, description, question_count, prix, is_active')
      .eq('is_active', true)

    if (type && (type === 'direct' || type === 'professionnel')) {
      query = query.eq('type', type)
    }

    const { data: categories, error } = await query

    if (error) throw error

    // Trier par ordre officiel
    const sorted = (categories || [])
      .map(c => ({
        id: c.id,
        nom: c.nom,
        type: c.type,
        description: c.description,
        question_count: c.question_count || 0,
        prix: c.prix || 0,
        icone: getCatIcon(c.nom, c.type),
        ordre: getCatOrdre(c.nom, c.type)
      }))
      .sort((a, b) => {
        // Trier d'abord par type, puis par ordre
        if (a.type !== b.type) return a.type.localeCompare(b.type)
        return a.ordre - b.ordre
      })

    return new Response(JSON.stringify({
      categories: sorted
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
