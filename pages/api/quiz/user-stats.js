export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

// API pour récupérer les statistiques globales de l'utilisateur (score + progression)
export default async function handler(req) {
  const R = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return R({ error: 'Non authentifié' }, 401)

  const decoded = await verifyToken(token)
  if (!decoded) return R({ error: 'Token invalide' }, 401)

  const userId = decoded.userId

  if (req.method === 'GET') {
    try {
      // Récupérer toutes les réponses de l'utilisateur
      const { data: allAnswers, error: answersError } = await supabaseAdmin
        .from('user_progress')
        .select('question_id, is_correct, created_at, questions(category_id, categories(id, nom, type))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (answersError) {
        return R({ success: true, stats: { totalAnswered: 0, totalCorrect: 0, scoreGlobal: 0, parDossier: [] } })
      }

      const answers = allAnswers || []
      const totalAnswered = answers.length
      const totalCorrect = answers.filter(a => a.is_correct).length
      const scoreGlobal = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

      // Grouper par catégorie
      const categoriesMap = {}
      for (const ans of answers) {
        const cat = ans.questions?.categories
        if (!cat) continue
        const catId = cat.id
        if (!categoriesMap[catId]) {
          categoriesMap[catId] = {
            id: catId,
            nom: cat.nom,
            type: cat.type,
            totalAnswered: 0,
            totalCorrect: 0
          }
        }
        categoriesMap[catId].totalAnswered++
        if (ans.is_correct) categoriesMap[catId].totalCorrect++
      }

      const parDossier = Object.values(categoriesMap).map(c => ({
        ...c,
        score: c.totalAnswered > 0 ? Math.round((c.totalCorrect / c.totalAnswered) * 100) : 0
      })).sort((a, b) => b.totalAnswered - a.totalAnswered)

      return R({
        success: true,
        stats: {
          totalAnswered,
          totalCorrect,
          scoreGlobal,
          parDossier
        }
      })
    } catch (err) {
      return R({ success: true, stats: { totalAnswered: 0, totalCorrect: 0, scoreGlobal: 0, parDossier: [] } })
    }
  }

  return R({ error: 'Méthode non autorisée' }, 405)
}
