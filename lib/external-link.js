// Helper pour gérer correctement les liens externes en PWA
// Évite que les liens WhatsApp / tel: / USSD ne sortent de l'application
// quand elle est installée en PWA (mode standalone).

import { openExternal, isMobile, isPWA } from './contact'

/**
 * Crée les props onClick pour un lien <a> qui doit rester dans l'app.
 * À utiliser pour tous les liens WhatsApp / tel: / USSD.
 *
 * Exemple:
 *   <a href={whatsappLink('Bonjour')} {...externalLinkHandler(whatsappLink('Bonjour'))}>
 *     Contactez-nous
 *   </a>
 */
export function externalLinkHandler(url) {
  return {
    onClick: (e) => {
      try { e.preventDefault() } catch {}
      openExternal(url)
    }
  }
}

/**
 * Handler pour USSD : copie le code + ouvre le composeur (mobile) ou alerte (desktop)
 */
export function ussdLinkHandler(ussdCode) {
  return {
    onClick: (e) => {
      try { e.preventDefault() } catch {}
      try { navigator.clipboard?.writeText(ussdCode) } catch {}
      if (isMobile() || isPWA()) {
        try { window.location.href = `tel:${encodeURIComponent(ussdCode)}` } catch {}
      } else {
        try { alert(`✅ Code copié : ${ussdCode}\n\nComposez-le sur votre téléphone Orange.`) } catch {}
      }
    }
  }
}

/**
 * Wrapper fetch avec timeout et gestion d'erreur unifiée
 * Renforce la robustesse des appels API IFL.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('La requête a pris trop de temps. Vérifiez votre connexion.')
      e.code = 'TIMEOUT'
      throw e
    }
    if (err.message && err.message.includes('Failed to fetch')) {
      const e = new Error('Connexion réseau impossible. Vérifiez votre connexion.')
      e.code = 'NETWORK'
      throw e
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Helper pour appels API IFL avec gestion d'erreur standardisée.
 * Retourne { ok, data, error } au lieu de throw.
 */
export async function apiCall(url, options = {}, timeoutMs = 15000) {
  try {
    const res = await fetchWithTimeout(url, options, timeoutMs)
    let data = null
    try { data = await res.json() } catch {}
    if (!res.ok) {
      return {
        ok: false,
        data,
        error: data?.error || `Erreur ${res.status}`,
        status: res.status
      }
    }
    return { ok: true, data, error: null, status: res.status }
  } catch (err) {
    return {
      ok: false,
      data: null,
      error: err.message || 'Erreur inconnue',
      code: err.code || 'UNKNOWN'
    }
  }
}
