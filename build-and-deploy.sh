#!/bin/bash
# =============================================================================
#  IFL — Build + Deploy hybride (Flutter Web + API Next.js sur Cloudflare Pages)
# =============================================================================
#  Ce script :
#   1. Builds the Next.js API surface as Cloudflare Pages Edge Functions
#      (via @cloudflare/next-on-pages -> .vercel/output/static/_worker.js)
#   2. Builds the Flutter web client
#   3. Merges the Flutter build into .vercel/output/static (preserving Functions)
#   4. Deploys the merged output to Cloudflare Pages with wrangler
#
#  Pourquoi ce setup ?
#   - L'app cliente est en Flutter (assets, écrans, logique UI)
#   - Les routes /api/* sont implémentées en Next.js (pages/api/*) et tournent
#     en tant que Cloudflare Pages Functions à l'edge
#   - L'auth (jose JWT), l'accès Supabase via SERVICE_ROLE_KEY, les paiements,
#     l'admin : tout reste côté serveur, jamais exposé au client Flutter
#
#  Pré-requis (déjà fournis dans le sandbox) :
#   - Node 18+, npm
#   - Flutter 3.35+
#   - wrangler CLI (npm install -g wrangler ou via npx)
#   - Variables d'env Cloudflare :
#       export CLOUDFLARE_ACCOUNT_ID=...
#       export CLOUDFLARE_API_TOKEN=...
# =============================================================================

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
PROJECT_NAME="ideal-formation-leaders"
BRANCH="${BRANCH:-main}"

cd "$ROOT"

echo "==> [1/4] Build Next.js -> Cloudflare Pages Functions"
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund --cache /tmp/npm-cache
fi
npx @cloudflare/next-on-pages

echo ""
echo "==> [2/4] Build Flutter web"
cd "$ROOT/flutter"
flutter pub get
flutter build web --release --no-tree-shake-icons
cd "$ROOT"

echo ""
echo "==> [3/4] Merge Flutter build into Cloudflare Pages output"
STATIC="$ROOT/.vercel/output/static"
FLUTTER="$ROOT/flutter/build/web"

# Remove Next.js static HTML pages (replaced by Flutter)
cd "$STATIC"
rm -f 404.html 500.html admin.html dashboard.html demo.html help.html \
      index.html login.html payment.html register.html select-specialty.html \
      manifest.json favicon.ico favicon.png logo.png service-worker.js version.json
rm -rf courses icons pwa-icons

# Copy Flutter build (preserves _worker.js, _routes.json, _headers, _next/, cdn-cgi/)
cp -R "$FLUTTER"/* "$STATIC"/

# CRITIQUE : forcer _routes.json à ne router QUE /api/* vers le worker Next.js,
# sinon tous les assets Flutter (SVG, main.dart.js, etc.) retournent 404 car
# next-on-pages génère par défaut "include":["/*"] qui capte tout le trafic.
cat > "$STATIC/_routes.json" <<'EOF'
{
  "version": 1,
  "description": "IFL hybrid: Next.js API + Flutter web client",
  "include": ["/api/*"],
  "exclude": []
}
EOF

cd "$ROOT"

echo ""
echo "==> [4/4] Deploy to Cloudflare Pages"
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "ERREUR : CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN doivent être exportés"
  exit 1
fi

npx --yes wrangler@4 pages deploy .vercel/output/static \
  --project-name="$PROJECT_NAME" \
  --branch="$BRANCH" \
  --commit-dirty=true

echo ""
echo "✅ Déploiement terminé. URL : https://${PROJECT_NAME}.pages.dev"
