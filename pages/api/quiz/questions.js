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
    const limitParam = url.searchParams.get('limit') || '100'
    const limit = Math.min(parseInt(limitParam, 10) || 100, 200)

    if (!categorieId) {
      return new Response(JSON.stringify({ error: 'categorie_id requis' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // ========================================================
    // 1. Récupérer le profil de l'utilisateur
    // ========================================================
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, subscription_status, subscription_type, subscription_expires_at')
      .eq('id', payload.userId)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Utilisateur introuvable' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }

    // ========================================================
    // 2. Récupérer la catégorie pour connaître son type
    // ========================================================
    const { data: category, error: catError } = await supabaseAdmin
      .from('categories')
      .select('id, nom, type')
      .eq('id', categorieId)
      .single()

    if (catError || !category) {
      return new Response(JSON.stringify({ error: 'Catégorie introuvable' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }

    // ========================================================
    // 3. Vérifier si l'utilisateur a accès complet
    //    Admin → accès total
    //    Abonnement actif + non expiré + type correspondant → accès total
    //    Sinon → seulement les questions gratuites (is_demo=true)
    // ========================================================
    const isAdmin = profile.role === 'superadmin' || profile.role === 'admin'
    
    let hasFullAccess = false
    if (isAdmin) {
      hasFullAccess = true
    } else if (profile.subscription_status === 'active') {
      // Vérifier expiration
      const now = new Date()
      const expiresAt = profile.subscription_expires_at
        ? new Date(profile.subscription_expires_at)
        : null
      const notExpired = !expiresAt || expiresAt > now
      
      if (notExpired) {
        const subType = profile.subscription_type
        // Accès si : type correspond ou abonnement 'all'
        if (
          subType === 'all' ||
          subType === category.type ||
          (subType === 'direct' && category.type === 'direct') ||
          (subType === 'professionnel' && category.type === 'professionnel')
        ) {
          hasFullAccess = true
        }
      }
    }

    // ========================================================
    // 4. Requête Supabase selon le niveau d'accès
    // ========================================================
    let query = supabaseAdmin
      .from('questions')
      .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo')
      .eq('category_id', categorieId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(limit)

    // Si pas d'accès complet, ne montrer que les questions gratuites
    if (!hasFullAccess) {
      query = query.eq('is_demo', true)
    }

    const { data: questions, error } = await query
    if (error) throw error

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

    // Si pas d'accès et aucune question gratuite trouvée
    if (!hasFullAccess && questionList.length === 0) {
      return new Response(JSON.stringify({
        error: `Abonnez-vous pour accéder aux QCM de "${category.nom}"`,
        requiresSubscription: true,
        categoryType: category.type
      }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({
      questions: questionList,
      hasFullAccess,
      totalFree: hasFullAccess ? null : questionList.length,
      categoryType: category.type
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
