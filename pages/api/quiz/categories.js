export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  // Vérifier l'authentification
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token requis' }), {
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
      .order('created_at', { ascending: true })

    if (type && (type === 'direct' || type === 'professionnel')) {
      query = query.eq('type', type)
    }

    const { data: categories, error } = await query

    if (error) throw error

    const getCatIcon = (nom, catType) => {
      const n = (nom || '').toLowerCase()
      if (n.includes('culture') || n.includes('actualit')) return '🌍'
      if (n.includes('français') || n.includes('franc')) return '📚'
      if (n.includes('littérature') || n.includes('art')) return '🎨'
      if (n.includes('histoire') || n.includes('géographie') || n.includes('h-g')) return '🗺️'
      if (n.includes('svt') || n.includes('science')) return '🧬'
      if (n.includes('psycho')) return '🧠'
      if (n.includes('math') || n.includes('match')) return '📐'
      if (n.includes('physique') || n.includes('chimie') || n.includes('pc')) return '⚗️'
      if (n.includes('qcm') || n.includes('entraîn')) return '✏️'
      if (n.includes('accompagn') || n.includes('final')) return '🎯'
      if (n.includes('vie scolaire') || n.includes('casu')) return '🏫'
      if (n.includes('cisu') || n.includes('enaref')) return '🏛️'
      if (n.includes('inspect')) return '🔍'
      if (n.includes('agrég')) return '🎓'
      if (n.includes('capes')) return '📖'
      if (n.includes('hôpital') || n.includes('hopital')) return '🏥'
      if (n.includes('santé') || n.includes('sante')) return '💊'
      if (n.includes('gsp')) return '🛡️'
      if (n.includes('police')) return '👮'
      if (n.includes('civil') || n.includes('admin')) return '📋'
      return catType === 'direct' ? '📚' : '🎓'
    }

    return new Response(JSON.stringify({
      categories: (categories || []).map(c => ({
        id: c.id,
        nom: c.nom,
        type: c.type,
        description: c.description,
        question_count: c.question_count || 0,
        prix: c.prix || 0,
        icone: getCatIcon(c.nom, c.type)
      }))
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
