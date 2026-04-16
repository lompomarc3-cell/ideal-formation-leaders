// IFL Service Worker – Progressive Web App
// Version : 1.2.0
const CACHE_VERSION = 'ifl-cache-v2'
const STATIC_CACHE = 'ifl-static-v2'
const API_CACHE = 'ifl-api-v1'

// Ressources à mettre en cache immédiatement (installation)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/icons/nav_home.svg',
  '/icons/nav_concours.svg',
  '/icons/nav_profil.svg',
  '/icons/nav_apropos.svg',
  '/icons/nav_direct.svg',
  '/icons/nav_pro.svg',
  '/icons/direct_globe.svg',
  '/icons/direct_book.svg',
  '/icons/direct_palette.svg',
  '/icons/direct_map.svg',
  '/icons/direct_leaf.svg',
  '/icons/direct_brain.svg',
  '/icons/direct_calculator.svg',
  '/icons/direct_flask.svg',
  '/icons/direct_scale.svg',
  '/icons/direct_chart.svg',
  '/icons/direct_pencil.svg',
  '/icons/direct_target.svg',
  '/icons/pro_school.svg',
  '/icons/pro_newspaper.svg',
  '/icons/pro_building.svg',
  '/icons/pro_search.svg',
  '/icons/pro_graduation.svg',
  '/icons/pro_scroll.svg',
  '/icons/pro_openbook.svg',
  '/icons/pro_hospital.svg',
  '/icons/pro_health.svg',
  '/icons/pro_justice.svg',
  '/icons/pro_judge.svg',
  '/icons/pro_shield.svg',
  '/icons/pro_badge.svg',
  '/icons/pro_clipboard.svg',
]

// ===== INSTALLATION =====
self.addEventListener('install', (event) => {
  console.log('[IFL SW] Installation v2...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch(err => console.warn('[IFL SW] Erreur mise en cache statique:', err))
    }).then(() => {
      console.log('[IFL SW] Installation terminée')
      return self.skipWaiting()
    })
  )
})

// ===== ACTIVATION =====
self.addEventListener('activate', (event) => {
  console.log('[IFL SW] Activation...')
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== API_CACHE)
          .map(key => {
            console.log('[IFL SW] Suppression ancien cache:', key)
            return caches.delete(key)
          })
      )
    }).then(() => {
      console.log('[IFL SW] Activation terminée')
      return self.clients.claim()
    })
  )
})

// ===== STRATÉGIE DE CACHE =====
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return

  // Ignorer les requêtes Supabase / API externes (toujours réseau)
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.io')) return

  // ── API Next.js (/api/*) : Network First, avec fallback cache ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Ne mettre en cache que les réponses OK
          if (response.ok) {
            const clone = response.clone()
            caches.open(API_CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // ── Pages Next.js (_next/*, pages) : Network First ──
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // ── Assets statiques (images, icônes, fonts) : Cache First ──
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/logo.png' ||
    url.pathname === '/manifest.json' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // ── Pages HTML : Network First avec fallback / ──
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone()
          caches.open(STATIC_CACHE).then(cache => cache.put(request, clone))
          return response
        })
        .catch(() => {
          return caches.match(request) || caches.match('/')
        })
    )
    return
  }
})

// ===== MESSAGES =====
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    event.ports[0]?.postMessage({ type: 'CACHE_CLEARED' })
  }
})
