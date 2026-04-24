// Helpers pour gérer la programmation de disparition des contenus.
// Comme nous ne pouvons pas modifier le schéma de la base (pas d'ALTER TABLE via l'API),
// nous encodons la programmation dans la colonne `description` de la table `categories`
// en utilisant un marqueur dédié `___SCHEDULE___`.
//
// Format stocké :
//   "<description utilisateur>\n___SCHEDULE___<json>"
//
// JSON exemple :
//   { "date": "2026-12-31T23:59:59.000Z", "enabled": true }
//
// Si `enabled === true` et la date actuelle dépasse `date`, la catégorie et toutes
// ses questions doivent être MASQUÉES aux utilisateurs non-admins.

export const SCHEDULE_MARKER = '___SCHEDULE___'

/**
 * Extrait la partie "description utilisateur" et la programmation depuis un champ `description`.
 * @param {string|null} descRaw
 * @returns {{ description: string, schedule: { date: string|null, enabled: boolean } }}
 */
export function parseDescription(descRaw) {
  const empty = { description: '', schedule: { date: null, enabled: false } }
  if (!descRaw) return empty
  const idx = descRaw.indexOf(SCHEDULE_MARKER)
  if (idx === -1) {
    return { description: descRaw, schedule: { date: null, enabled: false } }
  }
  const desc = descRaw.substring(0, idx).replace(/\s+$/, '')
  const jsonPart = descRaw.substring(idx + SCHEDULE_MARKER.length).trim()
  try {
    const parsed = JSON.parse(jsonPart)
    return {
      description: desc,
      schedule: {
        date: parsed.date || null,
        enabled: !!parsed.enabled
      }
    }
  } catch {
    return { description: desc, schedule: { date: null, enabled: false } }
  }
}

/**
 * Recompose un champ `description` en conservant la description utilisateur et en injectant
 * (ou retirant) la programmation.
 * @param {string} userDescription La description affichable aux utilisateurs.
 * @param {{ date: string|null, enabled: boolean }|null} schedule
 * @returns {string}
 */
export function buildDescription(userDescription, schedule) {
  const base = (userDescription || '').trim()
  if (!schedule || !schedule.enabled || !schedule.date) return base
  const payload = JSON.stringify({ date: schedule.date, enabled: true })
  return `${base}\n${SCHEDULE_MARKER}${payload}`
}

/**
 * Détermine si le contenu (catégorie) doit être masqué à un utilisateur non-admin
 * en fonction de sa programmation.
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
 * Formate une description pour retourner uniquement la partie visible à l'utilisateur.
 */
export function visibleDescription(descRaw) {
  return parseDescription(descRaw).description
}
