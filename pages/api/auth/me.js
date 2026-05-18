export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'
import {
  parseDescription,
  isScheduleDisabledByAdmin,
  isPaymentInvalidatedByDisabledSchedule
} from '../../../lib/scheduling'

// Dossiers d'accompagnement automatiquement débloqués avec tout abonnement professionnel
const DOSSIERS_ACCOMPAGNEMENT = [
  'Actualités et culture générale',
  'Entraînement QCM',
  'Accompagnement final'
]

// Calcule les dossiers débloqués pour un utilisateur professionnel (MULTI-DOSSIERS)
function getDossiersDebloquesMulti(dossiers_principaux) {
  if (!dossiers_principaux || dossiers_principaux.length === 0) return DOSSIERS_ACCOMPAGNEMENT
  // Union des dossiers principaux + accompagnements (sans doublons)
  const all = [...new Set([...dossiers_principaux, ...DOSSIERS_ACCOMPAGNEMENT])]
  return all
}

export default async function handler(req) {
  // 🔧 FIX #1 : interdiction de cache sur /api/auth/me (réponse spécifique à l'utilisateur,
  // doit refléter immédiatement la validation d'un paiement par l'admin).
  const NO_CACHE_HEADERS = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'CDN-Cache-Control': 'no-store'
  }
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: NO_CACHE_HEADERS})
  const res = {
    status: (s) => ({ json: (d) => R(d, s) }),
    json: (d) => R(d, 200)
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (error || !profile) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    const isAdmin = profile.role === 'superadmin' || profile.role === 'admin'
    const nameParts = (profile.full_name || '').trim().split(' ')
    const nom = nameParts[0] || ''
    const prenom = nameParts.slice(1).join(' ') || ''

    const abonnementType = profile.subscription_type || null

    // 🔧 FIX #1/#3 : Détection de l'expiration
    const now = new Date()
    const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
    const isExpired = !isAdmin && profile.subscription_status === 'active' && expiresAt && expiresAt < now
    const realStatus = isExpired ? 'expired' : profile.subscription_status

    // 🔧 FIX #3 : CUMUL DIRECT + PRO
    // Récupérer TOUS les paiements approuvés ET non expirés pour déterminer
    // - quels dossiers pro sont débloqués
    // - si l'utilisateur a aussi un abonnement direct actif
    let dossier_principal = null
    let dossiers_principaux = []
    let hasActiveDirect = false
    let hasActivePro = false
    // v2.3.0 : dossiers dont la programmation a été désactivée par l'admin et
    // pour lesquels l'utilisateur n'a pas (re)payé après la désactivation.
    let programming_disabled_folders = []

    if (!isAdmin) {
      // Récupérer les catégories pour connaître l'état programmation/désactivation
      const { data: allCategories } = await supabaseAdmin
        .from('categories')
        .select('id, nom, type, description')
        .eq('is_active', true)
        .limit(2000)

      // Construire une map des dossiers désactivés par l'admin avec la date de désactivation
      const disabledFoldersMap = new Map() // nom -> { disabled_at: Date, schedule }
      ;(allCategories || []).forEach(cat => {
        const { schedule } = parseDescription(cat.description)
        if (isScheduleDisabledByAdmin(schedule)) {
          disabledFoldersMap.set(cat.nom, {
            disabled_at: new Date(schedule.disabled_at),
            schedule
          })
        }
      })

      const { data: paymentRequests } = await supabaseAdmin
        .from('correction_requests')
        .select('message, created_at, status, admin_response')
        .eq('user_id', decoded.userId)
        .eq('status', 'approved')
        .like('message', '%ifl_payment%')
        .order('created_at', { ascending: false })

      // Sets pour suivre les paiements "récents" (post désactivation) par dossier/type
      const directHasFreshPayment = { value: false }
      const proFolderHasFreshPayment = new Set()
      // Et l'inverse : dossiers cibles d'un paiement obsolète, désactivé par l'admin
      const directHasStalePayment = { value: false }
      const proFolderHasStalePayment = new Set()

      if (paymentRequests && paymentRequests.length > 0) {
        for (const r of paymentRequests) {
          try {
            const parsed = JSON.parse(r.message)
            if (parsed.type !== 'ifl_payment') continue

            // Un paiement validé est considéré actif s'il a moins d'un an
            const validatedAt = new Date(r.created_at)
            const validUntil = new Date(validatedAt)
            validUntil.setFullYear(validUntil.getFullYear() + 1)
            const isPaymentActive = validUntil > now

            if (!isPaymentActive) continue // ignorer les paiements expirés

            if (parsed.type_concours === 'direct') {
              // Si AU MOINS UN dossier "direct" a été désactivé après ce paiement,
              // on marque le paiement direct comme obsolète pour CE dossier.
              // Mais pour l'abonnement global "direct", on garde activeDirect uniquement
              // si le paiement n'est pas invalidé par tous les dossiers directs concernés.
              // Pour simplifier la sémantique côté UI (cohérent avec questions.js),
              // on ne déduit pas globalement "direct" comme invalide — la décision
              // finale est faite par dossier dans quiz/questions.js.
              hasActiveDirect = true
              directHasFreshPayment.value = true
            } else if (parsed.type_concours === 'professionnel') {
              hasActivePro = true
              if (parsed.dossier_principal) {
                const folderName = parsed.dossier_principal
                const disabledInfo = disabledFoldersMap.get(folderName)
                if (disabledInfo && isPaymentInvalidatedByDisabledSchedule(disabledInfo.schedule, validatedAt)) {
                  // Paiement antérieur à la désactivation admin -> obsolète pour ce dossier
                  proFolderHasStalePayment.add(folderName)
                  // On ne l'ajoute PAS à dossiers_principaux : il a perdu l'accès.
                } else {
                  proFolderHasFreshPayment.add(folderName)
                  if (!dossiers_principaux.includes(folderName)) {
                    dossiers_principaux.push(folderName)
                  }
                }
              }
            }
          } catch {}
        }
      }

      // Calcul des dossiers à signaler comme "programming_disabled_folders" :
      // ceux que l'utilisateur avait payés MAIS dont la programmation a été désactivée
      // et pour lesquels il n'a pas refait de paiement valide.
      proFolderHasStalePayment.forEach(folder => {
        if (!proFolderHasFreshPayment.has(folder)) {
          programming_disabled_folders.push(folder)
        }
      })

      dossier_principal = dossiers_principaux.length > 0 ? dossiers_principaux[0] : null
    }

    // 🔧 FIX #3 : Déterminer le abonnement_type effectif (cumul direct + pro possible)
    let effectiveType = abonnementType
    if (hasActiveDirect && hasActivePro) {
      effectiveType = 'all' // accès complet (direct + pro)
    } else if (hasActiveDirect) {
      effectiveType = 'direct'
    } else if (hasActivePro) {
      effectiveType = 'professionnel'
    }

    // Calculer les dossiers débloqués (MULTI-DOSSIERS)
    let dossiersDebloques = null
    if (effectiveType === 'all' || effectiveType === 'direct') {
      // Accès à tout (direct couvre tous les dossiers directs + accompagnements offerts si pro)
      dossiersDebloques = hasActivePro ? getDossiersDebloquesMulti(dossiers_principaux) : null
    } else if (effectiveType === 'professionnel') {
      dossiersDebloques = getDossiersDebloquesMulti(dossiers_principaux)
    }

    // 🔧 FIX #1 : si tous les paiements sont expirés mais profile dit "active", on remet en expired
    const finalStatus = isAdmin
      ? 'active'
      : (hasActiveDirect || hasActivePro ? 'active' : (isExpired ? 'expired' : realStatus))

    return res.json({
      id: profile.id,
      phone: profile.phone,
      nom,
      prenom,
      full_name: profile.full_name,
      role: profile.role,
      is_admin: isAdmin,
      // Abonnement
      abonnement_type: effectiveType,
      abonnement_valide_jusqua: profile.subscription_expires_at,
      subscription_status: finalStatus,
      subscription_expired: isExpired || (!hasActiveDirect && !hasActivePro && abonnementType !== null && !isAdmin),
      // Flags additionnels pour l'UI (cumul direct + pro)
      has_active_direct: hasActiveDirect || isAdmin,
      has_active_pro: hasActivePro || isAdmin,
      // Dossier principal pour abonnement professionnel (compatibilité rétro)
      dossier_principal: dossier_principal,
      // Tous les dossiers débloqués (multi-dossiers)
      dossiers_debloques: dossiersDebloques,
      dossiers_principaux: dossiers_principaux,
      // v2.3.0 : dossiers pour lesquels la programmation a été désactivée par l'admin
      // et qui nécessitent un réabonnement (accès limité aux 5 questions gratuites).
      programming_disabled_folders: programming_disabled_folders,
      is_active: true
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message })
  }
}
