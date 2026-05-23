export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'
import {
  parseDescription,
  isScheduleExpired,
  isScheduleDisabledByAdmin,
  isPaymentInvalidatedByDisabledSchedule
} from '../../../lib/scheduling'

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
    // On vérifie : (a) programmation individuelle du dossier, (b) programmation globale par type.
    // ========================================================
    const { schedule: catSchedule } = parseDescription(category.description)
    const now2bis = new Date()
    const catExpiredIndividual = isScheduleExpired(catSchedule, now2bis)
    // v2.3.0 : programmation explicitement désactivée par l'admin.
    const catDisabledByAdmin = isScheduleDisabledByAdmin(catSchedule)
    const scheduleDisabledAt = catSchedule && catSchedule.disabled_at
      ? new Date(catSchedule.disabled_at)
      : null

    // 🆕 Vérifier aussi la programmation globale par type (direct / professionnel)
    const typeConfigName = category.type === 'direct' ? '__SCHEDULE_DIRECT__' : '__SCHEDULE_PRO__'
    const { data: typeConfigRow } = await supabaseAdmin
      .from('categories')
      .select('description')
      .eq('nom', typeConfigName)
      .eq('type', category.type)
      .eq('is_active', false)
      .maybeSingle()
    const typeGlobalSchedule = typeConfigRow
      ? parseDescription(typeConfigRow.description || '').schedule
      : null
    const typeGlobalExpired = isScheduleExpired(typeGlobalSchedule, now2bis)

    // Un dossier est expiré si sa prog individuelle OU sa prog globale par type est expirée
    const catExpired = catExpiredIndividual || typeGlobalExpired

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

    // ✅ CORRECTION programmation : le dossier reste visible.
    // Si la programmation est expirée ET que l'utilisateur n'est pas admin,
    // on force l'accès limité (5 premières questions gratuites uniquement).
    // L'admin continue de tout voir normalement.
    const scheduleLimitForUser = catExpired && !isAdmin

    let hasFullAccess = false
    let isLockedForThisUser = false // Dossier professionnel verrouillé pour cet utilisateur

    if (isAdmin) {
      hasFullAccess = true
    } else if (scheduleLimitForUser) {
      // 🔒 Programmation expirée pour un non-admin : on n'accorde JAMAIS l'accès complet.
      // Les 5 premières questions seront retournées plus bas (branche !hasFullAccess).
      hasFullAccess = false
    } else {
      // 🔧 FIX #3 : CUMUL DIRECT + PRO
      // On ne se base PLUS uniquement sur profile.subscription_type/status (qui sont écrasés).
      // On parcourt TOUS les paiements approuvés non expirés pour déterminer l'accès réel.
      const now = new Date()
      let hasActiveDirect = false
      let hasActivePro = false
      const dossiers_paid = []

      // Compat ancien format : prendre en compte aussi le subscription_type/expires_at
      const profileExpiresAt = profile.subscription_expires_at
        ? new Date(profile.subscription_expires_at)
        : null
      const profileNotExpired = !profileExpiresAt || profileExpiresAt > now

      // v2.3.0 : si une programmation a été désactivée, et que le profil n'a pas été
      // mis à jour depuis (subscription_expires_at antérieur à disabled_at OU pas de
      // updated_at), on ignore l'abonnement "global" du profil pour ce dossier.
      // Sécurité : on s'appuie sur subscription_expires_at qui est mis à jour à
      // chaque validation de paiement.
      let profileSubInvalidForThisCategory = false
      if (catDisabledByAdmin && scheduleDisabledAt) {
        // On considère le profil obsolète pour ce dossier si le "point de référence"
        // (expires_at) est antérieur à la désactivation + 1 an (= la durée de
        // validité d'un paiement). Autrement dit, si la date d'expiration courante
        // a été calculée à partir d'un paiement antérieur à la désactivation.
        if (profileExpiresAt) {
          const profilePaidAt = new Date(profileExpiresAt)
          profilePaidAt.setFullYear(profilePaidAt.getFullYear() - 1)
          if (profilePaidAt < scheduleDisabledAt) {
            profileSubInvalidForThisCategory = true
          }
        } else {
          // Pas d'expires_at → on ne peut pas dater le paiement, on l'invalide
          // par prudence (l'utilisateur devra se réabonner pour confirmer).
          profileSubInvalidForThisCategory = true
        }
      }

      if (profile.subscription_status === 'active' && profileNotExpired && !profileSubInvalidForThisCategory) {
        const { type: subType, dossier_principal: subDossier } = parseSubscriptionType(profile.subscription_type)
        if (subType === 'direct') hasActiveDirect = true
        if (subType === 'professionnel') {
          hasActivePro = true
          if (subDossier && !dossiers_paid.includes(subDossier)) dossiers_paid.push(subDossier)
        }
        if (subType === 'all') {
          hasActiveDirect = true
          hasActivePro = true
        }
      }

      // Parcourir tous les paiements approuvés et NON expirés (validité = 1 an depuis la validation)
      try {
        const { data: paymentRequests } = await supabaseAdmin
          .from('correction_requests')
          .select('message, created_at')
          .eq('user_id', payload.userId)
          .eq('status', 'approved')
          .like('message', '%ifl_payment%')
          .order('created_at', { ascending: false })

        if (paymentRequests && paymentRequests.length > 0) {
          for (const r of paymentRequests) {
            try {
              const parsed = JSON.parse(r.message)
              if (parsed.type !== 'ifl_payment') continue

              // Validité 1 an depuis la validation
              const validatedAt = new Date(r.created_at)
              const validUntil = new Date(validatedAt)
              validUntil.setFullYear(validUntil.getFullYear() + 1)
              if (validUntil < now) continue // expiré → on ignore

              // 🔧 v2.3.0 : si l'admin a désactivé la programmation pour ce dossier,
              // les paiements antérieurs à la désactivation sont invalidés.
              // L'utilisateur doit se réabonner pour retrouver l'accès complet.
              if (isPaymentInvalidatedByDisabledSchedule(catSchedule, validatedAt)) {
                continue
              }

              if (parsed.type_concours === 'direct') {
                hasActiveDirect = true
              } else if (parsed.type_concours === 'professionnel') {
                hasActivePro = true
                if (parsed.dossier_principal && !dossiers_paid.includes(parsed.dossier_principal)) {
                  dossiers_paid.push(parsed.dossier_principal)
                }
              }
            } catch {}
          }
        }
      } catch {}

      // 🔧 FIX #3 : Logique d'accès STRICTE sans risque de mélange entre Pros.
      // - direct : accès uniquement si abonnement direct actif
      // - professionnel : accès uniquement si :
      //     a) le dossier exact a été payé (présent dans dossiers_paid), OU
      //     b) c'est un dossier d'accompagnement (bonus inclus avec n'importe quel Pro)
      // Aucune autre dérogation : on supprime le fallback "isOldFormatNoSpecialty"
      // qui pouvait, sur d'anciens enregistrements, donner accès à tous les pros.
      if (category.type === 'direct' && hasActiveDirect) {
        // ✅ Accès TOTAL aux dossiers directs
        hasFullAccess = true
      } else if (category.type === 'professionnel') {
        if (hasActivePro) {
          const isPaidDossier = dossiers_paid.includes(category.nom)
          const isAccompagnement = DOSSIERS_ACCOMPAGNEMENT.includes(category.nom)
          if (isPaidDossier || isAccompagnement) {
            hasFullAccess = true
          } else {
            // Dossier pro non acheté = verrouillé (5 questions gratuites)
            isLockedForThisUser = true
            hasFullAccess = false
          }
        } else {
          // Aucun abonnement pro actif → 5 questions gratuites
          hasFullAccess = false
        }
      } else {
        // Aucun abonnement actif pour ce type de catégorie → 5 questions gratuites
        hasFullAccess = false
      }
    }

    // ========================================================
    // 4. Requête Supabase selon le niveau d'accès
    // ========================================================
    // Si pas d'accès complet, on retourne TOUJOURS jusqu'à 5 questions gratuites :
    //   - d'abord les questions marquées is_demo=true (priorité),
    //   - puis on complète avec les premières questions actives (par created_at)
    //     jusqu'à atteindre 5, pour les dossiers qui ont moins de 5 demo.
    if (!hasFullAccess) {
      // 1) Récupérer les questions is_demo=true (max 5)
      const { data: demoQuestions, error: demoError } = await supabaseAdmin
        .from('questions')
        .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo, matiere, difficulte, created_at')
        .eq('category_id', categorieId)
        .eq('is_active', true)
        .eq('is_demo', true)
        .order('created_at', { ascending: true })
        .limit(5)

      // 2) 🔧 FIX #2 : si on a < 5 demo, compléter avec les premières questions actives
      //    (en excluant celles déjà sélectionnées) jusqu'à atteindre 5.
      let combined = (!demoError && demoQuestions) ? [...demoQuestions] : []
      if (combined.length < 5) {
        const missing = 5 - combined.length
        const excludeIds = combined.map(q => q.id)
        let query = supabaseAdmin
          .from('questions')
          .select('id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo, matiere, difficulte, created_at')
          .eq('category_id', categorieId)
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(missing + excludeIds.length) // on prend de la marge puis on filtre
        const { data: fillers } = await query
        if (fillers && fillers.length > 0) {
          for (const q of fillers) {
            if (excludeIds.includes(q.id)) continue
            combined.push(q)
            if (combined.length >= 5) break
          }
        }
      }

      if (combined.length >= 1) {
        // On a au moins 1 question, on les retourne (max 5)
        const questionList = combined.slice(0, 5).map(q => ({
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
          categoryName: category.nom,
          scheduleExpired: scheduleLimitForUser,
          scheduleDisabledByAdmin: !isAdmin && catDisabledByAdmin,
          lockedMessage: !isAdmin && catDisabledByAdmin
            ? 'Programmation désactivée par l\'administrateur — renouvelez votre abonnement'
            : (scheduleLimitForUser
              ? 'Contenu non disponible pendant la période de programmation'
              : null)
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
          categoryName: category.nom,
          scheduleExpired: scheduleLimitForUser,
          scheduleDisabledByAdmin: !isAdmin && catDisabledByAdmin,
          lockedMessage: !isAdmin && catDisabledByAdmin
            ? 'Programmation désactivée par l\'administrateur — renouvelez votre abonnement'
            : (scheduleLimitForUser
              ? 'Contenu non disponible pendant la période de programmation'
              : null)
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

      // Si programmation expirée et aucune question disponible
      if (scheduleLimitForUser) {
        return new Response(JSON.stringify({
          questions: [],
          hasFullAccess: false,
          isLockedSpecialty: false,
          totalFree: 0,
          categoryType: category.type,
          categoryName: category.nom,
          scheduleExpired: true,
          scheduleDisabledByAdmin: !isAdmin && catDisabledByAdmin,
          lockedMessage: !isAdmin && catDisabledByAdmin
            ? 'Programmation désactivée par l\'administrateur — renouvelez votre abonnement'
            : 'Contenu non disponible pendant la période de programmation'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
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
