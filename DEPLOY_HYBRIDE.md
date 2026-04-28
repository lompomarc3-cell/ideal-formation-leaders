# Déploiement hybride IFL (Flutter Web + API Next.js)

## Architecture

L'application IFL combine deux stacks dans un **seul déploiement Cloudflare Pages** :

| Couche       | Technologie         | Rôle                                                |
|--------------|---------------------|-----------------------------------------------------|
| Client       | Flutter Web         | UI (écrans Accueil/Direct/Pro/Profil/À propos)      |
| API edge     | Next.js `pages/api` | Auth (JWT jose), Supabase, paiements, admin         |
| Plateforme   | Cloudflare Pages    | Static hosting + Functions (worker `_worker.js`)    |

Les routes `/api/*` sont compilées en Cloudflare Pages Functions par
`@cloudflare/next-on-pages`, et le client Flutter (qui pointe vers
`https://ideal-formation-leaders.pages.dev` par défaut) les appelle directement
sans aucun CORS proxy : tout est servi sur le même domaine.

## Pourquoi ce setup hybride ?

L'agent précédent a déployé uniquement le bundle Flutter web statique sur
Cloudflare Pages. Conséquence : toutes les routes `/api/*` retournaient
l'`index.html` de Flutter (HTTP 200, `text/html`) au lieu de JSON, ce qui
cassait :

- L'affichage des 12 dossiers directs et 17 dossiers professionnels
- L'inscription / connexion (admin `76223962` ne pouvait plus se logger)
- La page Profil (`/api/quiz/user-stats` ne répondait pas)
- Les paiements et la console admin

Le code Flutter et les API Next.js étaient tous les deux corrects et
fonctionnels — il manquait juste une étape de fusion lors du déploiement.

## Procédure de déploiement

### Méthode rapide (script tout-en-un)

```bash
export CLOUDFLARE_ACCOUNT_ID=7400903a57315c803f548fb4f86aa0dc
export CLOUDFLARE_API_TOKEN=cfut_...   # token avec scope Pages:Edit
./build-and-deploy.sh
```

### Méthode manuelle (étape par étape)

```bash
# 1. Build Next.js -> Cloudflare Functions (.vercel/output/static)
npm install
npx @cloudflare/next-on-pages@1

# 2. Build Flutter Web
cd flutter
flutter pub get
flutter build web --release --no-tree-shake-icons
cd ..

# 3. Fusion : remplacer les pages HTML Next.js par l'app Flutter,
#    en conservant _worker.js (les Functions), _routes.json, _headers, _next/
cd .vercel/output/static
rm -f 404.html 500.html admin.html dashboard.html demo.html help.html \
      index.html login.html payment.html register.html select-specialty.html \
      manifest.json favicon.ico favicon.png logo.png service-worker.js version.json
rm -rf courses icons pwa-icons
cp -R ../../../flutter/build/web/* .
cd ../../..

# 4. Deploy
npx wrangler@4 pages deploy .vercel/output/static \
  --project-name=ideal-formation-leaders \
  --branch=main \
  --commit-dirty=true
```

## Fichiers conservés à la fusion

L'étape de fusion **NE DOIT PAS** écraser ces éléments générés par
`@cloudflare/next-on-pages` :

| Chemin                                    | Rôle                                  |
|-------------------------------------------|---------------------------------------|
| `.vercel/output/static/_worker.js/`       | Le Pages Function bundle (les API)    |
| `.vercel/output/static/_routes.json`      | Routing API/static                    |
| `.vercel/output/static/_headers`          | Headers de sécurité + cache           |
| `.vercel/output/static/_next/static/`     | Assets statiques Next.js (chunks)     |
| `.vercel/output/static/cdn-cgi/`          | Endpoints internes Cloudflare         |

Le script `build-and-deploy.sh` gère ça automatiquement.

## Tests post-déploiement

```bash
# 1. API publique : doit retourner JSON, pas HTML
curl -s 'https://ideal-formation-leaders.pages.dev/api/quiz/public-categories?type=direct' | head -c 200
#   → {"categories":[{"id":"...","nom":"Actualité / Culture Générale",...

# 2. Login admin : doit retourner un token JWT
curl -s -X POST 'https://ideal-formation-leaders.pages.dev/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"phone":"76223962","password":"IFL@Admin2025!"}'
#   → {"success":true,"token":"eyJ...","user":{"role":"superadmin",...}}

# 3. Page Flutter
curl -sI 'https://ideal-formation-leaders.pages.dev/' | head -2
#   → HTTP/2 200 / content-type: text/html
```

## Données en base (vérifié)

- **29 catégories** au total dans `categories` (table Supabase)
  - 12 avec `type='direct'`
  - 17 avec `type='professionnel'`
- **125 questions** avec `is_active=true`

> Note : la colonne s'appelle `type` (et non `type_concours`).

## Comptes de test

- **Admin** : `76223962` / `IFL@Admin2025!` (NIAMPA Issa, role `superadmin`)
