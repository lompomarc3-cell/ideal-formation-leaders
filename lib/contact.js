// Helpers pour les contacts IFL (téléphone, WhatsApp, USSD).
// Centralise les numéros/liens afin d'éviter les divergences.

export const IFL_PHONE = '+22676223962'
export const IFL_PHONE_DISPLAY = '+226 76 22 39 62'
export const IFL_WHATSAPP_NUMBER = '22676223962'
export const IFL_USSD_CODE = '*144*10*76223962#'

/**
 * Détecte si l'app est lancée en mode PWA (standalone)
 * En mode PWA, window.open(url, '_blank') peut sortir de l'app vers un navigateur externe.
 * On force donc l'ouverture par l'intent système (window.location) pour les protocoles
 * tel:/sms:/whatsapp:/mailto:, et on utilise un anchor caché avec target="_top" pour HTTP.
 */
export function isPWA() {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
  } catch { return false }
}

export function isMobile() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
}

/**
 * Ouvre un lien externe (WhatsApp, tel, USSD) sans quitter la PWA si possible.
 * - Pour tel:/sms:/mailto:/intent: : utilise window.location.href (intent système Android/iOS)
 * - Pour WhatsApp (wa.me) : tente l'app native via le scheme whatsapp:// d'abord, puis fallback
 * - Pour HTTP(S) : tente d'ouvrir dans un onglet (desktop) ou window.location (mobile/PWA)
 *
 * Retourne true si l'ouverture a été tentée, false sinon.
 */
export function openExternal(url, opts = {}) {
  if (!url || typeof window === 'undefined') return false
  const { fallback = null, copyOnFail = null } = opts
  try {
    // Protocoles natifs (intent système) — toujours via window.location
    if (/^(tel:|sms:|mailto:)/i.test(url)) {
      window.location.href = url
      return true
    }
    // WhatsApp : tenter le scheme natif d'abord (ouvre l'app), fallback wa.me
    if (/wa\.me\/|api\.whatsapp\.com/i.test(url)) {
      // Utiliser window.location pour rester dans la même fenêtre / déléguer au système
      // qui ouvrira l'app WhatsApp si installée (intent handler)
      if (isMobile() || isPWA()) {
        window.location.href = url
        return true
      }
      // Desktop : ouvrir dans nouvel onglet
      const w = window.open(url, '_blank', 'noopener,noreferrer')
      if (!w) window.location.href = url
      return true
    }
    // HTTP(S) générique : ouvrir dans nouvel onglet (desktop) ou même fenêtre (PWA)
    if (isPWA()) {
      window.location.href = url
    } else {
      const w = window.open(url, '_blank', 'noopener,noreferrer')
      if (!w) window.location.href = url
    }
    return true
  } catch (e) {
    if (fallback) {
      try { window.location.href = fallback } catch {}
    } else if (copyOnFail) {
      try { navigator.clipboard?.writeText(copyOnFail) } catch {}
      try { alert(`Impossible d'ouvrir le lien.\n\nCopié : ${copyOnFail}`) } catch {}
    }
    return false
  }
}

// Lien tel: pour composer le code USSD (encodage du # => %23).
// Sur Android, `tel:*144*10*76223962%23` ouvre le composeur pré-rempli.
// Sur iOS, `tel:` fonctionne aussi pour les USSD avec %23 encodé.
export const IFL_USSD_TEL = `tel:${encodeURIComponent(IFL_USSD_CODE)}`

export function whatsappLink(text = '') {
  const base = `https://wa.me/${IFL_WHATSAPP_NUMBER}`
  if (!text) return base
  return `${base}?text=${encodeURIComponent(text)}`
}

export function telLink(phone = IFL_PHONE) {
  return `tel:${phone}`
}

/**
 * Copie le code USSD dans le presse-papier, avec feedback.
 * Retourne true si la copie a réussi.
 */
export async function copyUssd() {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(IFL_USSD_CODE)
      return true
    }
  } catch {}
  return false
}

/**
 * Action combinée pour un bouton USSD :
 * 1. Copie le code dans le presse-papier (silencieux)
 * 2. Tente d'ouvrir le composeur avec le code pré-rempli (intent système, ne sort pas de l'app)
 * Si l'ouverture du composeur échoue (desktop), on affiche juste un toast.
 */
export async function dialOrCopyUssd() {
  const copied = await copyUssd()
  try {
    if (typeof window !== 'undefined' && isMobile()) {
      // window.location.href déclenche l'intent tel: => composeur natif (reste dans l'app sur PWA)
      window.location.href = IFL_USSD_TEL
      return { copied, dialed: true }
    }
  } catch {}
  if (copied && typeof window !== 'undefined') {
    try { window.alert(`✅ Code copié : ${IFL_USSD_CODE}\n\nComposez-le sur votre téléphone Orange.`) } catch {}
  }
  return { copied, dialed: false }
}

/**
 * Ouvre WhatsApp avec un message pré-rempli, sans quitter la PWA.
 * Utilise openExternal qui gère les cas mobile/PWA/desktop.
 */
export function openWhatsApp(message = '') {
  return openExternal(whatsappLink(message))
}

/**
 * Ouvre le composeur téléphonique pour appeler un numéro (intent système).
 */
export function callPhone(phone = IFL_PHONE) {
  return openExternal(telLink(phone))
}
