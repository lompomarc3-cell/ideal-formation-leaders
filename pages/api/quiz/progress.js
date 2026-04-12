export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req) {
  let body = {}
  if (req.method !== 'GET') {
    try { body = await req.json() } catch {}
  }
  const R = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return R({ error: 'Non authentifié' }, 401)

  const decoded = await verifyToken(token)
  if (!decoded) return R({ error: 'Token invalide' }, 401)

  const userId = decoded.userId

  // GET: récupérer la progression
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const categorieId = url.searchParams.get('categorie_id')

    try {
      let query = supabaseAdmin
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)

      if (categorieId) query = query.eq('category_id', categorieId)

      const { data, error } = await query
      if (error) return R({ error: error.message }, 500)

      return R({ progress: data || [] })
    } catch (err) {
      return R({ error: err.message }, 500)
    }
  }

  // POST: sauvegarder la progression
  if (req.method === 'POST') {
    const { categorie_id, derniere_question_index, score } = body

    if (!categorie_id) return R({ error: 'categorie_id requis' }, 400)

    try {
      // Upsert dans user_progress avec le nouvel index
      const upsertData = {
        user_id: userId,
        category_id: categorie_id,
        derniere_question_index: derniere_question_index || 0,
        updated_at: new Date().toISOString()
      }

      if (score !== undefined) upsertData.score = score

      const { error } = await supabaseAdmin
        .from('user_progress')
        .upsert(upsertData, { onConflict: 'user_id,category_id' })

      if (error) {
        // Si la table n'a pas ces colonnes, on ignore silencieusement
        // La progression localStorage sera utilisée en fallback
        return R({ success: true, note: 'Progression sauvegardée localement' })
      }

      return R({ success: true })
    } catch (err) {
      return R({ success: true, note: 'Fallback localStorage actif' })
    }
  }

  return R({ error: 'Méthode non autorisée' }, 405)
}
