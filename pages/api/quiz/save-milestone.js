export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

// 🆕 MISSION : Sauvegarde du palier de 50 questions atteint dans le dossier
// "Entraînement QCM". Table Supabase : quiz_milestones
//   id (UUID/serial), user_id (UUID), folder_id (UUID),
//   question_count (INT), score_at_50 (INT),
//   created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ)
//
// Cette sauvegarde est OPTIONNELLE : elle ne doit jamais bloquer l'app.
// On répond toujours success:true même en cas d'erreur côté base.

export default async function handler(req) {
  const R = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') {
    return R({ error: 'Méthode non autorisée' }, 405)
  }

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return R({ error: 'Non authentifié' }, 401)

  const decoded = await verifyToken(token)
  if (!decoded) return R({ error: 'Token invalide' }, 401)

  const userId = decoded.userId

  let body = {}
  try {
    body = await req.json()
  } catch {}

  const { categorie_id, question_count, score_at_50 } = body

  if (!categorie_id) {
    return R({ error: 'categorie_id requis' }, 400)
  }

  try {
    const { error } = await supabaseAdmin.from('quiz_milestones').insert({
      user_id: userId,
      folder_id: categorie_id,
      question_count: question_count || 0,
      score_at_50: typeof score_at_50 === 'number' ? score_at_50 : 0,
    })

    if (error) {
      // Échec silencieux : la sauvegarde du milestone est optionnelle.
      return R({ success: true, note: 'milestone_not_saved', detail: error.message })
    }

    return R({ success: true })
  } catch (err) {
    return R({ success: true, note: 'milestone_error', detail: err.message })
  }
}
