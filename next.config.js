/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true
  },
  // Pour Cloudflare Pages avec Next.js static export
  // output: 'export', // On garde en mode SSR pour les API routes
}

module.exports = nextConfig
