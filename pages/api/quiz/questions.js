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
    const url = new URL(req.url)
    const categorie_id = url.searchParams.get('categorie_id')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    if (!categorie_id) {
      return res.status(400).json({ error: 'categorie_id requis' })
    }

    const { data: questions, error } = await supabaseAdmin
      .from('questions')
      .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo')
      .eq('category_id', categorie_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) return res.status(500).json({ error: error.message })

    const mapped = (questions || []).map(q => ({
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

    return res.json({ questions: mapped })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
