// Helpers pour gérer la programmation de disparition des contenus.
// Comme nous ne pouvons pas modifier le schéma de la base (pas d'ALTER TABLE via l'API),
// nous encodons la programmation dans la colonne `description` de la table `categories`
// en utilisant un marqueur dédié `___SCHEDULE___`.
//
// Format stocké :
//   "<description utilisateur>\n___SCHEDULE___<json>"
//
// JSON exemple (programmation active) :
//   { "date": "2026-12-31T23:59:59.000Z", "enabled": true }
//
// JSON exemple (programmation DÉSACTIVÉE par l'admin - v2.3.0) :
//   { "date": "2026-12-31T23:59:59.000Z", "enabled": false, "disabled_at": "2025-05-20T10:00:00.000Z" }
//
// Règles métier :
// - Si `enabled === true` et la date actuelle dépasse `date`, la catégorie expire :
//   les utilisateurs non-admins n'ont plus accès complet (5 questions gratuites seulement).
// - Si `enabled === false` et `disabled_at` est présent :
//   ✅ NOUVEAU v2.3.0 : tous les paiements validés AVANT `disabled_at` sont considérés
//   invalides pour ce dossier. L'utilisateur perd l'accès complet et doit se réabonner
//   (un nouveau paiement validé APRÈS `disabled_at` rétablit l'accès complet).

export const SCHEDULE_MARKER = '___SCHEDULE___'

/**
 * Extrait la partie "description utilisateur" et la programmation depuis un champ `description`.
 * @param {string|null} descRaw
 * @returns {{ description: string, schedule: { date: string|null, enabled: boolean, disabled_at: string|null } }}
 */
export function parseDescription(descRaw) {
  const empty = { description: '', schedule: { date: null, enabled: false, disabled_at: null } }
  if (!descRaw) return empty
  const idx = descRaw.indexOf(SCHEDULE_MARKER)
  if (idx === -1) {
    return { description: descRaw, schedule: { date: null, enabled: false, disabled_at: null } }
  }
  const desc = descRaw.substring(0, idx).replace(/\s+$/, '')
  const jsonPart = descRaw.substring(idx + SCHEDULE_MARKER.length).trim()
  try {
    const parsed = JSON.parse(jsonPart)
    return {
      description: desc,
      schedule: {
        date: parsed.date || null,
        enabled: !!parsed.enabled,
        disabled_at: parsed.disabled_at || null
      }
    }
  } catch {
    return { description: desc, schedule: { date: null, enabled: false, disabled_at: null } }
  }
}

/**
 * Recompose un champ `description` en conservant la description utilisateur et en injectant
 * (ou retirant) la programmation.
 *
 * Comportements :
 *   - schedule null OU sans date  -> on retire complètement le marqueur (état neutre, jamais programmé)
 *   - schedule.enabled === true   -> programmation active : { date, enabled: true }
 *   - schedule.enabled === false  -> programmation DÉSACTIVÉE : on garde une trace persistante
 *                                    { date, enabled: false, disabled_at }
 *
 * @param {string} userDescription La description affichable aux utilisateurs.
 * @param {{ date: string|null, enabled: boolean, disabled_at?: string|null }|null} schedule
 * @returns {string}
 */
export function buildDescription(userDescription, schedule) {
  const base = (userDescription || '').trim()
  if (!schedule) return base

  // Programmation active : on garde la date prévue
  if (schedule.enabled === true && schedule.date) {
    const payload = JSON.stringify({ date: schedule.date, enabled: true })
    return `${base}\n${SCHEDULE_MARKER}${payload}`
  }

  // Programmation désactivée explicitement (avec disabled_at) :
  // On conserve l'information pour invalider les anciens abonnements.
  if (schedule.enabled === false && schedule.disabled_at) {
    const payload = JSON.stringify({
      date: schedule.date || null,
      enabled: false,
      disabled_at: schedule.disabled_at
    })
    return `${base}\n${SCHEDULE_MARKER}${payload}`
  }

  // Aucun état pertinent à stocker
  return base
}

/**
 * Détermine si le contenu (catégorie) doit être masqué à un utilisateur non-admin
 * en fonction de sa programmation (date dépassée).
 * @param {{ date: string|null, enabled: boolean }} schedule
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isScheduleExpired(schedule, now = new Date()) {
  if (!schedule || !schedule.enabled || !schedule.date) return false
  const d = new Date(schedule.date)
  if (Number.isNaN(d.getTime())) return false
  return now.getTime() >= d.getTime()
}

/**
 * NOUVEAU v2.3.0 - Détermine si la programmation a été désactivée par l'admin et qu'il
 * faut donc forcer la perte d'accès complet pour les utilisateurs dont l'abonnement a
 * été validé AVANT la désactivation.
 *
 * @param {{ enabled: boolean, disabled_at: string|null }} schedule
 * @returns {boolean}
 */
export function isScheduleDisabledByAdmin(schedule) {
  if (!schedule) return false
  return schedule.enabled === false && !!schedule.disabled_at
}

/**
 * NOUVEAU v2.3.0 - Renvoie true si un paiement donné (par sa date de validation)
 * est INVALIDÉ par la désactivation de programmation. Un paiement est invalidé si :
 *   - la programmation est désactivée (enabled=false, disabled_at présent), ET
 *   - le paiement a été validé STRICTEMENT AVANT disabled_at.
 *
 * Un paiement effectué après disabled_at reste valide → l'utilisateur récupère
 * son accès complet en se réabonnant.
 *
 * @param {{ enabled: boolean, disabled_at: string|null }} schedule
 * @param {Date|string} paymentValidatedAt date de validation du paiement
 * @returns {boolean}
 */
export function isPaymentInvalidatedByDisabledSchedule(schedule, paymentValidatedAt) {
  if (!isScheduleDisabledByAdmin(schedule)) return false
  const disabledAt = new Date(schedule.disabled_at)
  if (Number.isNaN(disabledAt.getTime())) return false
  const paidAt = paymentValidatedAt instanceof Date
    ? paymentValidatedAt
    : new Date(paymentValidatedAt)
  if (Number.isNaN(paidAt.getTime())) return false
  return paidAt.getTime() < disabledAt.getTime()
}

/**
 * Formate une description pour retourner uniquement la partie visible à l'utilisateur.
 */
export function visibleDescription(descRaw) {
  return parseDescription(descRaw).description
}
