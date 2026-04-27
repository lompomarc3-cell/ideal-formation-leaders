// API PUBLIQUE - Questions gratuites sans authentification
// Retourne les 5 premières questions gratuites (is_demo=true) pour les visiteurs non connectés
export const runtime = 'edge'
import { parseDescription, isScheduleExpired } from '../../../lib/scheduling'

const SUPABASE_URL = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44'

// Validation stricte du format UUID v4 (et compatible v1-v5).
// Évite les erreurs 500 en bloquant les requêtes avec des IDs malformés (ex: 'invalid-id').
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id.trim())
}

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  try {
    const url = new URL(req.url)
    const categorieId = url.searchParams.get('categorie_id')

    if (!categorieId) {
      return new Response(JSON.stringify({ error: 'categorie_id requis' }), {
        status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // 🛡️ Validation stricte : un UUID malformé doit retourner 400 (Bad Request)
    // et non 500 (Internal Server Error). Évite l'erreur 500 reportée en production.
    if (!isValidUUID(categorieId)) {
      return new Response(JSON.stringify({
        error: 'Identifiant de catégorie invalide',
        code: 'INVALID_UUID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // 1. Récupérer la catégorie (avec description pour check programmation)
    const catRes = await fetch(
      `${SUPABASE_URL}/rest/v1/categories?id=eq.${encodeURIComponent(categorieId)}&is_active=eq.true&select=id,nom,type,description`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!catRes.ok) {
      const detail = await catRes.text().catch(() => '')
      console.error('[public-questions] Erreur Supabase categories', catRes.status, detail)
      // Si Supabase renvoie 400 (UUID invalide passé en filtre malgré validation), on remonte 400.
      const statusCode = catRes.status === 400 ? 400 : 502
      return new Response(JSON.stringify({
        error: 'Impossible de récupérer la catégorie',
        upstreamStatus: catRes.status
      }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    const catArr = await catRes.json()
    const category = catArr && catArr.length > 0 ? catArr[0] : null

    if (!category) {
      return new Response(JSON.stringify({ error: 'Catégorie introuvable' }), {
        status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // 1.bis. Vérifier programmation : si expirée, bloquer les visiteurs (non-admin)
    const { schedule: catSchedule } = parseDescription(category.description)
    if (isScheduleExpired(catSchedule, new Date())) {
      return new Response(JSON.stringify({
        error: `Ce dossier n'est plus disponible.`,
        expired: true,
        categoryName: category.nom,
        categoryType: category.type
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // 2. Récupérer les 5 premières questions gratuites de la catégorie
    // D'abord essayer avec is_demo=true, sinon prendre les 5 premières
    const qRes = await fetch(
      `${SUPABASE_URL}/rest/v1/questions?category_id=eq.${encodeURIComponent(categorieId)}&is_active=eq.true&select=id,enonce,option_a,option_b,option_c,option_d,reponse_correcte,explication,is_demo,matiere,difficulte&order=created_at.asc&limit=5`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!qRes.ok) {
      const detail = await qRes.text().catch(() => '')
      console.error('[public-questions] Erreur Supabase questions', qRes.status, detail)
      // En cas d'erreur Supabase, on retourne une liste vide plutôt que 500
      // afin que l'utilisateur voie "Questions bientôt disponibles" et non une page d'erreur.
      return new Response(JSON.stringify({
        questions: [],
        hasFullAccess: false,
        isPublic: true,
        categoryName: category.nom,
        categoryType: category.type,
        message: 'Questions temporairement indisponibles. Veuillez réessayer plus tard.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    const questions = await qRes.json()

    const questionList = (questions || []).map(q => ({
      id: q.id,
      question_text: q.enonce,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      bonne_reponse: q.reponse_correcte,
      explication: q.explication,
      is_demo: q.is_demo,
      matiere: q.matiere || 'QCM',
      difficulte: q.difficulte || 'moyen'
    }))

    // Si aucune question, renvoyer un message clair
    if (questionList.length === 0) {
      return new Response(JSON.stringify({
        questions: [],
        hasFullAccess: false,
        isPublic: true,
        categoryName: category.nom,
        categoryType: category.type,
        message: 'Questions bientôt disponibles pour ce dossier'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=30'
        }
      })
    }

    return new Response(JSON.stringify({
      questions: questionList,
      hasFullAccess: false,
      isPublic: true,
      totalFree: questionList.length,
      categoryName: category.nom,
      categoryType: category.type
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=30'
      }
    })

  } catch (err) {
    console.error('[public-questions] Erreur inattendue', err && err.message, err && err.stack)
    return new Response(JSON.stringify({
      error: 'Erreur serveur',
      detail: err && err.message ? err.message : 'unknown'
    }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
