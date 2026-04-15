export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

// Dossiers d'accompagnement automatiquement débloqués avec tout abonnement professionnel
const DOSSIERS_ACCOMPAGNEMENT = [
  'Actualités et culture générale',
  'Entraînement QCM',
  'Accompagnement final'
]

// Parse le subscription_type pour extraire le type et le dossier principal
function parseSubscriptionType(subscriptionType) {
  if (!subscriptionType) return { type: null, dossier_principal: null }
  if (subscriptionType === 'direct') return { type: 'direct', dossier_principal: null }
  if (subscriptionType === 'all') return { type: 'all', dossier_principal: null }
  if (subscriptionType === 'professionnel') return { type: 'professionnel', dossier_principal: null }
  if (subscriptionType.startsWith('professionnel:')) {
    const dossier = subscriptionType.substring('professionnel:'.length)
    return { type: 'professionnel', dossier_principal: dossier }
  }
  return { type: subscriptionType, dossier_principal: null }
}

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
    // 2. Récupérer la catégorie pour connaître son type et nom
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
    //    Abonnement direct actif + categorie.type === 'direct' → accès total
    //    Abonnement professionnel actif :
    //      - Dossier principal → accès total
    //      - Dossiers d'accompagnement → accès total
    //      - Autres dossiers pro → accès limité (5 questions gratuites seulement)
    //    Sinon → seulement les questions gratuites (is_demo=true)
    // ========================================================
    const isAdmin = profile.role === 'superadmin' || profile.role === 'admin'
    
    let hasFullAccess = false
    let isLockedForThisUser = false // Dossier professionnel verrouillé pour cet utilisateur

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
        const { type: subType, dossier_principal } = parseSubscriptionType(profile.subscription_type)
        
        if (subType === 'all') {
          hasFullAccess = true
        } else if (subType === 'direct' && category.type === 'direct') {
          hasFullAccess = true
        } else if (subType === 'professionnel' && category.type === 'professionnel') {
          // Vérifier si c'est le dossier principal ou un dossier d'accompagnement
          const isMainDossier = dossier_principal && category.nom === dossier_principal
          const isAccompagnement = DOSSIERS_ACCOMPAGNEMENT.includes(category.nom)
          const isOldFormatNoSpecialty = !dossier_principal // Ancien format sans spécialité = accès total (rétrocompat.)
          
          if (isMainDossier || isAccompagnement || isOldFormatNoSpecialty) {
            hasFullAccess = true
          } else {
            // C'est un autre dossier professionnel = verrouillé
            isLockedForThisUser = true
            hasFullAccess = false
          }
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

    // Si pas d'accès complet, ne montrer que les questions gratuites (is_demo=true ou les 5 premières)
    if (!hasFullAccess) {
      // D'abord essayer avec is_demo=true
      const { data: demoQuestions, error: demoError } = await supabaseAdmin
        .from('questions')
        .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo')
        .eq('category_id', categorieId)
        .eq('is_active', true)
        .eq('is_demo', true)
        .order('created_at', { ascending: true })
        .limit(5)

      if (!demoError && demoQuestions && demoQuestions.length >= 1) {
        // On a des questions is_demo=true, les utiliser (max 5)
        const questionList = demoQuestions.slice(0, 5).map(q => ({
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

        if (isLockedForThisUser && questionList.length === 0) {
          return new Response(JSON.stringify({
            error: `Ce dossier ne fait pas partie de votre abonnement. Votre spécialité est différente.`,
            requiresSubscription: true,
            isLockedSpecialty: true,
            categoryType: category.type
          }), { status: 403, headers: { 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({
          questions: questionList,
          hasFullAccess: false,
          isLockedSpecialty: isLockedForThisUser,
          totalFree: questionList.length,
          categoryType: category.type,
          categoryName: category.nom
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      // Fallback : prendre les 5 premières questions actives
      const { data: first5, error: first5Error } = await supabaseAdmin
        .from('questions')
        .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo')
        .eq('category_id', categorieId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(5)

      if (!first5Error && first5 && first5.length > 0) {
        const questionList = first5.map(q => ({
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

        return new Response(JSON.stringify({
          questions: questionList,
          hasFullAccess: false,
          isLockedSpecialty: isLockedForThisUser,
          totalFree: questionList.length,
          categoryType: category.type,
          categoryName: category.nom
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      // Si dossier verrouillé et aucune question
      if (isLockedForThisUser) {
        return new Response(JSON.stringify({
          error: `Ce dossier ne fait pas partie de votre abonnement. Votre spécialité est différente.`,
          requiresSubscription: true,
          isLockedSpecialty: true,
          categoryType: category.type
        }), { status: 403, headers: { 'Content-Type': 'application/json' } })
      }

      // Aucune question disponible
      return new Response(JSON.stringify({
        error: `Abonnez-vous pour accéder aux QCM de "${category.nom}"`,
        requiresSubscription: true,
        categoryType: category.type
      }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }

    // Accès complet : récupérer toutes les questions
    const { data: questions, error } = await supabaseAdmin
      .from('questions')
      .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo')
      .eq('category_id', categorieId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(limit)

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

    return new Response(JSON.stringify({
      questions: questionList,
      hasFullAccess: true,
      isLockedSpecialty: false,
      totalFree: null,
      categoryType: category.type,
      categoryName: category.nom
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
