export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

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
    const categorieId = url.searchParams.get('categorie_id')
    const limitParam = url.searchParams.get('limit') || '50'
    const limit = parseInt(limitParam, 10) || 50

    if (!categorieId) {
      return new Response(JSON.stringify({ error: 'categorie_id requis' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data: questions, error } = await supabaseAdmin
      .from('questions')
      .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo')
      .eq('category_id', categorieId)
      .eq('is_active', true)
      .limit(limit)

    if (error) throw error

    return new Response(JSON.stringify({
      questions: (questions || []).map(q => ({
        id: q.id,
        question_text: q.enonce,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        bonne_reponse: q.reponse_correcte,
        explication: q.explication,
        is_demo: q.is_demo
      }))
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
