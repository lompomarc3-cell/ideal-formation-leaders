export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

// NOTE: La table user_progress réelle a les colonnes: id, user_id, question_id, is_correct, created_at
// La progression d'index (derniere_question_index) est gérée en localStorage côté client
// Cette API sert à enregistrer les réponses individuelles et calculer les scores

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

  // GET: récupérer la progression (score + réponses pour une catégorie)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const categorieId = url.searchParams.get('categorie_id')

    try {
      // Récupérer les questions de la catégorie pour avoir les IDs
      let progressData = {
        success: true,
        progress: null,
        // La progression d'index est stockée en localStorage - on retourne uniquement le score serveur
        note: 'index_progress_in_localStorage'
      }

      if (categorieId) {
        // Récupérer les questions de la catégorie
        const { data: questions, error: qError } = await supabaseAdmin
          .from('questions')
          .select('id')
          .eq('category_id', categorieId)
          .eq('is_active', true)

        if (!qError && questions && questions.length > 0) {
          const questionIds = questions.map(q => q.id)
          
          // Récupérer les réponses de l'utilisateur pour ces questions
          const { data: userAnswers, error: aError } = await supabaseAdmin
            .from('user_progress')
            .select('question_id, is_correct, created_at')
            .eq('user_id', userId)
            .in('question_id', questionIds)
            .order('created_at', { ascending: false })

          if (!aError && userAnswers) {
            const correctAnswers = userAnswers.filter(a => a.is_correct).length
            const totalAnswered = userAnswers.length
            progressData.progress = {
              user_id: userId,
              categorie_id: categorieId,
              score: correctAnswers,
              total_answered: totalAnswered,
              derniere_question_index: 0, // Géré en localStorage côté client
              updated_at: userAnswers[0]?.created_at || null
            }
          }
        }
      }

      return R(progressData)
    } catch (err) {
      // En cas d'erreur, on retourne un succès vide (la progression localStorage prend le relais)
      return R({ success: true, progress: null, error_detail: err.message })
    }
  }

  // POST: sauvegarder une réponse individuelle
  if (req.method === 'POST') {
    const { categorie_id, question_id, is_correct, derniere_question_index, score } = body

    try {
      // Essayer d'enregistrer dans user_progress si question_id est fourni
      if (question_id) {
        const { error } = await supabaseAdmin
          .from('user_progress')
          .insert({
            user_id: userId,
            question_id: question_id,
            is_correct: is_correct || false
          })

        if (error && !error.message.includes('duplicate')) {
          // Ignorer les erreurs silencieusement - le localStorage est le fallback
        }
      }

      // La progression d'index (derniere_question_index) est gérée en localStorage
      // On retourne toujours success: true pour ne pas bloquer l'app
      return R({ success: true })
    } catch (err) {
      return R({ success: true, note: 'Fallback localStorage actif' })
    }
  }

  return R({ error: 'Méthode non autorisée' }, 405)
}
