// Helpers pour les contacts IFL (téléphone, WhatsApp, USSD).
// Centralise les numéros/liens afin d'éviter les divergences.

export const IFL_PHONE = '+22676223962'
export const IFL_PHONE_DISPLAY = '+226 76 22 39 62'
export const IFL_WHATSAPP_NUMBER = '22676223962'
export const IFL_USSD_CODE = '*144*10*76223962#'

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
 * 2. Tente d'ouvrir le composeur avec le code pré-rempli
 * Si l'ouverture du composeur échoue (desktop), on affiche juste un toast.
 */
export async function dialOrCopyUssd() {
  const copied = await copyUssd()
  // Tenter d'ouvrir le composeur (mobile uniquement, desktop ignorera)
  try {
    if (typeof window !== 'undefined') {
      // Vérifier si c'est un mobile (heuristique simple)
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
      if (isMobile) {
        window.location.href = IFL_USSD_TEL
        return { copied, dialed: true }
      }
    }
  } catch {}
  // Desktop : juste afficher un message de confirmation
  if (copied && typeof window !== 'undefined') {
    try { window.alert(`✅ Code copié : ${IFL_USSD_CODE}\n\nComposez-le sur votre téléphone Orange.`) } catch {}
  }
  return { copied, dialed: false }
}
