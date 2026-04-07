export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req) {
  // Helper pour compatibilité Edge Runtime
  let body = {}
  if (req.method !== 'GET') {
    try { body = await req.json() } catch {}
  }
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json'}})
  const res = {
    status: (s) => ({ json: (d) => R(d, s) }),
    json: (d) => R(d, 200)
  }
  const reqData = { body, method: req.method, query: {}, headers: req.headers }

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  const userId = decoded.userId

  if (req.method === 'GET') {
    const { categorie_id } = req.query

    let query = supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)

    if (categorie_id) query = query.eq('question_id', categorie_id)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    return res.json({ progress: data || [] })
  }

  if (req.method === 'POST') {
    const { categorie_id, question_id, is_correct } = req.body

    if (!question_id) return res.status(400).json({ error: 'question_id requis' })

    const { error } = await supabaseAdmin
      .from('user_progress')
      .upsert({
        user_id: userId,
        question_id,
        is_correct: is_correct || false
      }, { onConflict: 'user_id,question_id' })

    if (error) return res.status(500).json({ error: error.message })

    return res.json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
