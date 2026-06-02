/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  // 🔧 Build stabilité : forcer un seul worker de prerendering/export.
  // Le build parallèle (4 CPU) provoquait une race condition intermittente
  // (ENOENT rename .next/export/*.html → .next/server/pages/*.html) qui
  // faisait échouer next-on-pages. Avec 1 seul worker, le build est
  // déterministe et passe du premier coup.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Headers de sécurité pour toutes les pages
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Protection XSS
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer Policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions Policy
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Cache agressif pour les assets statiques (images, CSS, JS)
        source: '/(.*)\\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|css|js)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Pas de cache pour les APIs (données dynamiques)
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
