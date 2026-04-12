// API PUBLIQUE - Questions gratuites sans authentification
// Retourne les 5 premières questions gratuites (is_demo=true) pour les visiteurs non connectés
export const runtime = 'edge'

const SUPABASE_URL = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44'

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

    // 1. Récupérer la catégorie
    const catRes = await fetch(
      `${SUPABASE_URL}/rest/v1/categories?id=eq.${categorieId}&is_active=eq.true&select=id,nom,type`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!catRes.ok) throw new Error('Erreur récupération catégorie')
    const catArr = await catRes.json()
    const category = catArr && catArr.length > 0 ? catArr[0] : null

    if (!category) {
      return new Response(JSON.stringify({ error: 'Catégorie introuvable' }), {
        status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // 2. Récupérer les 5 premières questions gratuites de la catégorie
    // D'abord essayer avec is_demo=true, sinon prendre les 5 premières
    const qRes = await fetch(
      `${SUPABASE_URL}/rest/v1/questions?category_id=eq.${categorieId}&is_active=eq.true&select=id,enonce,option_a,option_b,option_c,option_d,reponse_correcte,explication,is_demo&order=created_at.asc&limit=5`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!qRes.ok) throw new Error('Erreur récupération questions')
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
      is_demo: q.is_demo
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
          'Cache-Control': 'public, max-age=30'
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
        'Cache-Control': 'public, max-age=30'
      }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
