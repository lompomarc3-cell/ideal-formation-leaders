/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Configuration pour Cloudflare Pages avec next-on-pages
  experimental: {
    runtime: 'edge'
  }
}

module.exports = nextConfig
