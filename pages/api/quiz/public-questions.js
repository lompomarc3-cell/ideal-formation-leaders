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

    // 1.bis. Vérifier programmation.
    // ✅ CORRECTION: Le dossier reste accessible mais limité aux 5 premières questions gratuites.
    // L'utilisateur public n'a déjà accès qu'aux 5 premières questions, donc le comportement
    // reste identique. On ajoute simplement un flag informatif `scheduleExpired`.
    const { schedule: catSchedule } = parseDescription(category.description)
    const scheduleExpired = isScheduleExpired(catSchedule, new Date())

    // 2. 🔧 FIX #2 : récupérer TOUJOURS jusqu'à 5 questions gratuites.
    //    Priorité aux questions marquées is_demo=true ; on complète avec les
    //    premières questions actives par created_at si on a moins de 5 demos.
    const headersSb = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }

    // 2a) is_demo=true (max 5)
    const demoRes = await fetch(
      `${SUPABASE_URL}/rest/v1/questions?category_id=eq.${encodeURIComponent(categorieId)}&is_active=eq.true&is_demo=eq.true&select=id,enonce,option_a,option_b,option_c,option_d,reponse_correcte,explication,is_demo,matiere,difficulte&order=created_at.asc&limit=5`,
      { headers: headersSb }
    )
    let questions = []
    if (demoRes.ok) {
      try { questions = await demoRes.json() } catch { questions = [] }
    }

    // 2b) Si < 5, compléter avec les premières questions actives (hors doublons)
    if (!Array.isArray(questions)) questions = []
    if (questions.length < 5) {
      const missing = 5 - questions.length
      const fillRes = await fetch(
        `${SUPABASE_URL}/rest/v1/questions?category_id=eq.${encodeURIComponent(categorieId)}&is_active=eq.true&select=id,enonce,option_a,option_b,option_c,option_d,reponse_correcte,explication,is_demo,matiere,difficulte&order=created_at.asc&limit=${missing + questions.length}`,
        { headers: headersSb }
      )
      if (fillRes.ok) {
        const fillers = await fillRes.json().catch(() => [])
        if (Array.isArray(fillers)) {
          const existingIds = new Set(questions.map(q => q.id))
          for (const q of fillers) {
            if (existingIds.has(q.id)) continue
            questions.push(q)
            if (questions.length >= 5) break
          }
        }
      }
    }

    // Gestion d'erreur globale (les deux appels ont échoué)
    if (!demoRes.ok && (!questions || questions.length === 0)) {
      console.error('[public-questions] Erreur Supabase questions', demoRes.status)
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
        scheduleExpired,
        message: scheduleExpired
          ? 'Contenu non disponible pendant la période de programmation'
          : 'Questions bientôt disponibles pour ce dossier'
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
      categoryType: category.type,
      scheduleExpired,
      // Si la programmation est expirée, on signale au front que les questions au-delà de la 5ème
      // sont indisponibles ("Contenu non disponible pendant la période de programmation").
      lockedMessage: scheduleExpired
        ? 'Contenu non disponible pendant la période de programmation'
        : null
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
