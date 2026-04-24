import { useState, useEffect } from 'react'

/**
 * Composant d'affichage de prix avec gestion des promotions actives.
 *
 * Props:
 * - type: 'direct' | 'professionnel'
 * - prices: objet { direct: { prix, prix_promo, has_promo }, professionnel: { ... } }
 *           (optionnel : si non fourni, le composant charge /api/quiz/public-prices)
 * - className: classes CSS sur le wrapper
 * - size: 'sm' | 'md' | 'lg' (taille du texte)
 * - showSuffix: afficher " FCFA" après le prix (true par défaut)
 * - lightTheme: true pour fond sombre (texte clair)
 */
export default function PromoPrice({
  type = 'direct',
  prices = null,
  className = '',
  size = 'md',
  showSuffix = true,
  lightTheme = false
}) {
  const [data, setData] = useState(prices)
  const [loaded, setLoaded] = useState(!!prices)

  useEffect(() => {
    if (prices) {
      setData(prices)
      setLoaded(true)
      return
    }
    let cancelled = false
    fetch('/api/quiz/public-prices')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (d && d.prices) {
          setData(d.prices)
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
    return () => { cancelled = true }
  }, [prices])

  const fallback = { direct: { prix: 5000, prix_promo: null, has_promo: false }, professionnel: { prix: 20000, prix_promo: null, has_promo: false } }
  const info = (data && data[type]) || fallback[type]
  const hasPromo = !!info.has_promo && info.prix_promo && info.prix_promo < info.prix

  const fmt = (n) => Number(n).toLocaleString('fr-FR')

  const sizes = {
    sm: { promo: 'text-sm font-extrabold', old: 'text-xs', suffix: 'text-xs' },
    md: { promo: 'text-base font-extrabold', old: 'text-xs', suffix: 'text-xs' },
    lg: { promo: 'text-lg font-extrabold', old: 'text-sm', suffix: 'text-xs' }
  }
  const s = sizes[size] || sizes.md
  const oldColor = lightTheme ? 'text-gray-300' : 'text-gray-500'

  if (!loaded) {
    return <span className={className}>{fmt(info.prix)}{showSuffix ? ' FCFA' : ''}</span>
  }

  if (!hasPromo) {
    return (
      <span className={className}>
        <span className={s.promo}>{fmt(info.prix)}</span>
        {showSuffix && <span className={`${s.suffix} ml-1`}>FCFA</span>}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className={`${oldColor} line-through ${s.old}`}>{fmt(info.prix)}</span>
      <span className={s.promo} style={{ color: '#DC2626' }}>{fmt(info.prix_promo)}</span>
      {showSuffix && <span className={`${s.suffix}`}>FCFA</span>}
    </span>
  )
}

/**
 * Hook utilitaire : charge les prix publics (avec promotions appliquées).
 * Retourne { prices, loading, hasPromo(type) }
 */
export function usePublicPrices() {
  const [prices, setPrices] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/quiz/public-prices')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (d && d.prices) setPrices(d.prices)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [])

  const hasPromo = (type) => {
    const p = prices && prices[type]
    return !!(p && p.has_promo && p.prix_promo && p.prix_promo < p.prix)
  }

  const getPrice = (type) => {
    const p = prices && prices[type]
    if (!p) return type === 'direct' ? 5000 : 20000
    return hasPromo(type) ? p.prix_promo : p.prix
  }

  return { prices, loading, hasPromo, getPrice }
}
