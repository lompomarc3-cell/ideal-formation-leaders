export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'
import { parseDescription, isScheduleExpired } from '../../../lib/scheduling'

// Dossiers d'accompagnement automatiquement débloqués avec tout abonnement professionnel
const DOSSIERS_ACCOMPAGNEMENT = [
  'Actualités et culture générale',
  'Entraînement QCM',
  'Accompagnement final'
]

// Validation stricte du format UUID pour éviter les erreurs 500 venant de Postgres
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id.trim())
}

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

// Récupère TOUTES les questions d'une catégorie en pagination
// (Supabase impose une limite par défaut de 1000 lignes par requête).
async function fetchAllQuestionsForCategory(categorieId, hardLimit = 10000) {
  const pageSize = 1000
  const all = []
  let from = 0
  while (all.length < hardLimit) {
    const to = Math.min(from + pageSize - 1, hardLimit - 1)
    const { data, error } = await supabaseAdmin
      .from('questions')
      .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo, matiere, difficulte')
      .eq('category_id', categorieId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .range(from, to)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return all
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
    // Pas de limite arbitraire : on récupère TOUTES les questions disponibles.
    // Un plafond de sécurité très élevé (10000) est appliqué pour éviter tout abus.
    const MAX_QUESTIONS = 10000
    const limitParam = url.searchParams.get('limit')
    const requestedLimit = limitParam ? parseInt(limitParam, 10) : MAX_QUESTIONS
    const limit = Math.min(Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : MAX_QUESTIONS, MAX_QUESTIONS)

    if (!categorieId) {
      return new Response(JSON.stringify({ error: 'categorie_id requis' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // 🛡️ Validation stricte UUID : évite les erreurs 500 sur des IDs malformés
    if (!isValidUUID(categorieId)) {
      return new Response(JSON.stringify({
        error: 'Identifiant de catégorie invalide',
        code: 'INVALID_UUID'
      }), {
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
      .select('id, nom, type, description')
      .eq('id', categorieId)
      .single()

    if (catError || !category) {
      return new Response(JSON.stringify({ error: 'Catégorie introuvable' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }

    // ========================================================
    // 2.bis Vérifier la programmation (disparition à date donnée).
    // L'admin continue de tout voir. Les utilisateurs normaux n'ont plus accès.
    // ========================================================
    const { schedule: catSchedule } = parseDescription(category.description)
    const catExpired = isScheduleExpired(catSchedule, new Date())

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

    // Si catégorie expirée ET utilisateur non-admin → bloquer totalement
    if (catExpired && !isAdmin) {
      return new Response(JSON.stringify({
        error: `Ce dossier n'est plus disponible.`,
        expired: true,
        categoryType: category.type
      }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }
    
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
    // Si pas d'accès complet, ne montrer que les questions gratuites (is_demo=true ou les 5 premières)
    if (!hasFullAccess) {
      // D'abord essayer avec is_demo=true
      const { data: demoQuestions, error: demoError } = await supabaseAdmin
        .from('questions')
        .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo, matiere, difficulte')
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
          is_demo: q.is_demo,
          matiere: q.matiere || 'QCM',
          difficulte: q.difficulte || 'moyen'
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
        .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo, matiere, difficulte')
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
          is_demo: q.is_demo,
          matiere: q.matiere || 'QCM',
          difficulte: q.difficulte || 'moyen'
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

    // Accès complet : récupérer TOUTES les questions (pagination automatique)
    let questions
    try {
      questions = await fetchAllQuestionsForCategory(categorieId, limit)
    } catch (error) {
      throw error
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

    return new Response(JSON.stringify({
      questions: questionList,
      hasFullAccess: true,
      isLockedSpecialty: false,
      totalFree: null,
      categoryType: category.type,
      categoryName: category.nom
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('[quiz/questions] Erreur inattendue', err && err.message, err && err.stack)
    return new Response(JSON.stringify({
      error: 'Erreur serveur',
      detail: err && err.message ? err.message : 'unknown'
    }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
