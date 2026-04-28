# IFL — Migration Next.js → Flutter (web + Android)

> **Idéale Formation of Leaders** — application QCM des concours directs et professionnels du Burkina Faso.
> Migration UI vers Flutter avec préservation **intégrale** du back‑end Next.js (26 routes API,
> Supabase, JWT, Cloudflare Pages). Aucune régression visible : même URL, mêmes comptes, mêmes données.

---

## 1. Architecture cible

```
┌────────────────────────────────────────────────────────────────────────┐
│  https://ideal-formation-leaders.pages.dev    (Cloudflare Pages)       │
│                                                                         │
│  ┌──────────────────────────────┐    ┌───────────────────────────────┐ │
│  │  Front Flutter Web (statique) │    │  Functions Next.js (Edge)    │ │
│  │  - lib/screens/*.dart         │    │  - 26 routes /api/*          │ │
│  │  - JWT en SharedPreferences   │ ─► │  - Supabase service-role key │ │
│  │  - http package → /api/*      │    │  - JWT HS256 (jose)          │ │
│  └──────────────────────────────┘    └──────────┬───────────────────┘ │
│                                                  │                      │
└──────────────────────────────────────────────────┼──────────────────────┘
                                                   ▼
                                  https://cyasoaihjjochwhnhwqf.supabase.co
                                  (profiles · categories · questions ·
                                   user_progress · correction_requests)
```

- **Aucun secret côté client** : la `SUPABASE_SERVICE_ROLE_KEY` reste exclusivement
  dans les Functions Edge Next.js.
- **JWT custom** (HS256 + sel SHA‑256) : émis par `/api/auth/login` ou
  `/api/auth/register`, persisté côté Flutter via `SharedPreferences`,
  envoyé en `Authorization: Bearer <token>` sur chaque appel protégé.
- **Routage hybride** sur Cloudflare Pages : `_routes.json` ne déclenche le
  Worker Next.js que pour `/api/*`. Tout le reste est servi en statique
  (build Flutter Web).

---

## 2. Arborescence du dépôt

```
ideal-formation-leaders/
├── pages/                       # ← Next.js (back‑end conservé tel quel)
│   ├── api/                     #   26 routes Edge
│   └── *.js                     #   pages legacy (non servies, fallback statique)
├── lib/                         # ← Helpers Next.js (auth.js, supabase.js, …)
├── components/                  # ← Composants React legacy
├── flutter/                     # ★ NOUVEAU : projet Flutter
│   ├── lib/
│   │   ├── main.dart            #   Point d'entrée + routes nommées
│   │   ├── theme/app_theme.dart #   Couleurs IFL : #C4521A #8B2500 #D4A017
│   │   ├── services/
│   │   │   ├── api_service.dart #   Client HTTP des 26 endpoints Next.js
│   │   │   └── auth_service.dart#   ChangeNotifier + JWT persistant
│   │   ├── models/{user,category}.dart
│   │   ├── widgets/cat_icon.dart#   Mapping emoji → SVG (12 directs / 17 pros)
│   │   ├── screens/
│   │   │   ├── splash_screen.dart
│   │   │   ├── welcome_screen.dart
│   │   │   ├── home_screen.dart
│   │   │   ├── login_screen.dart
│   │   │   ├── register_screen.dart
│   │   │   ├── dashboard_screen.dart
│   │   │   ├── quiz_screen.dart
│   │   │   ├── payment_screen.dart
│   │   │   └── select_specialty_screen.dart
│   │   └── admin/admin_screen.dart
│   ├── assets/                  #   logo.png + 10 icônes SVG (direct_*.svg)
│   ├── web/index.html           #   PWA + loader IFL (gradient terracotta)
│   ├── android/                 #   plate‑forme Android prête à compiler
│   └── pubspec.yaml             #   ifl 2.1.0+1
└── README_FLUTTER.md            ← ce fichier
```

---

## 3. Mapping pages Next.js → écrans Flutter

| Next.js (`pages/*.js`)            | Flutter (`lib/screens/*.dart`)         |
|-----------------------------------|----------------------------------------|
| `_app.js` (AuthProvider/Splash)   | `main.dart` + `_Bootstrap`             |
| `index.js`                        | `home_screen.dart`                     |
| `login.js`                        | `login_screen.dart`                    |
| `register.js`                     | `register_screen.dart`                 |
| `dashboard.js`                    | `dashboard_screen.dart`                |
| `quiz/[id].js` + `quiz/public/[id].js` | `quiz_screen.dart` (mode public/auth) |
| `payment.js`                      | `payment_screen.dart`                  |
| `select-specialty.js`             | `select_specialty_screen.dart`         |
| `admin/index.js`                  | `admin/admin_screen.dart`              |

Les 26 routes `pages/api/**.js` sont **inchangées** et continuent d'être
exécutées par les Functions Edge Cloudflare via `@cloudflare/next-on-pages`.

---

## 4. Mapping API Next.js → méthodes `ApiService`

Toutes les méthodes ajoutent automatiquement `Authorization: Bearer <token>`
quand un token est fourni. Aucune ne sérialise la `SUPABASE_SERVICE_ROLE_KEY`.

| Endpoint Next.js                          | `ApiService.method(...)`               |
|-------------------------------------------|----------------------------------------|
| `POST /api/auth/login`                    | `login(phone, password)`               |
| `POST /api/auth/register`                 | `register(...)`                        |
| `GET  /api/auth/me`                       | `me(token)`                            |
| `POST /api/auth/change-password`          | `changePassword(token, old, new)`      |
| `GET  /api/quiz/public-categories?type=`  | `publicCategories(type)`               |
| `GET  /api/quiz/public-questions?…`       | `publicQuestions(catId)`               |
| `GET  /api/quiz/public-prices`            | `publicPrices()`                       |
| `GET  /api/quiz/prices`                   | `prices()`                             |
| `GET  /api/quiz/categories?type=`         | `categories(token, type)`              |
| `GET  /api/quiz/questions?…`              | `questions(token, catId)`              |
| `GET  /api/quiz/progress?…`               | `getProgress(token, catId)`            |
| `POST /api/quiz/progress`                 | `saveProgress(token, …)`               |
| `GET  /api/quiz/user-stats`               | `userStats(token)`                     |
| `POST /api/payment/request`               | `createPaymentRequest(token, …)`       |
| `GET  /api/admin/stats`                   | `adminStats(token)`                    |
| `GET  /api/admin/users`                   | `adminUsers(token)`                    |
| `GET  /api/admin/payments`                | `adminPayments(token)`                 |
| `GET  /api/admin/categories`              | `adminCategories(token)`               |
| `GET  /api/admin/questions`               | `adminQuestions(token, catId)`         |
| `POST /api/admin/validate-payment`        | `adminValidatePayment(token, …)`       |

---

## 5. Charte graphique préservée

Identique au CSS Next.js (`styles/globals.css`) :

- Primary terracotta : `#C4521A`
- Dark terracotta   : `#8B2500`
- Gold              : `#D4A017`
- Light background  : `#FFF8F0`
- Accent            : `#F5871F`
- Police            : Poppins (chargée via Material default)
- Logo              : `assets/logo.png` (101 KB, identique au repo Next.js)
- Icônes catégories : 10 SVG `assets/icons/direct_*.svg` + mapping emoji → clé
  (cf. `lib/widgets/cat_icon.dart`)

---

## 6. Construire et lancer en local

```bash
cd flutter

# Une seule fois
flutter pub get

# Web (Chrome) — appelle l'API de prod par défaut
flutter run -d chrome

# Web — pointer une autre API (dev local Next.js par exemple)
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000

# Android (release APK)
flutter build apk --release
```

> Le projet utilise Flutter **3.35.4** / Dart **3.9.2**.
> `flutter analyze` passe avec 0 erreur (2 infos cosmétiques restantes).

---

## 7. Construire et déployer le web (production)

Le déploiement est **hybride** : il fusionne le build Flutter avec la sortie
`@cloudflare/next-on-pages` (qui contient le `_worker.js` des 26 routes API).

```bash
# 1) Build Flutter Web
cd flutter && flutter build web --release && cd ..

# 2) Build Functions Next.js (Edge runtime)
npx @cloudflare/next-on-pages@1
#  → produit .vercel/output/static/_worker.js + _next/

# 3) Fusion dans un dossier de déploiement
rm -rf deploy_hybrid && mkdir deploy_hybrid
cp -r flutter/build/web/. deploy_hybrid/
cp -r .vercel/output/static/_worker.js deploy_hybrid/
cp -r .vercel/output/static/_next      deploy_hybrid/

# 4) _routes.json — les API passent par le Worker, le reste est statique (Flutter)
cat > deploy_hybrid/_routes.json <<'JSON'
{ "version": 1, "include": ["/api/*"], "exclude": [] }
JSON

# 5) Déploiement
CLOUDFLARE_ACCOUNT_ID=7400903a57315c803f548fb4f86aa0dc \
CLOUDFLARE_API_TOKEN=cfut_ntPC...                       \
wrangler pages deploy deploy_hybrid \
  --project-name=ideal-formation-leaders --branch=main
```

URL de production (inchangée) : **https://ideal-formation-leaders.pages.dev**

---

## 8. Vérifications post‑déploiement

| Test                                                       | Résultat attendu               |
|------------------------------------------------------------|--------------------------------|
| `GET /` → HTML                                             | `200 text/html` (UI Flutter)   |
| `GET /api/quiz/public-prices`                              | `200 application/json`         |
| `GET /api/quiz/public-categories?type=direct`              | `200` JSON, 12 dossiers        |
| `GET /api/quiz/public-categories?type=professionnel`       | `200` JSON, 17 dossiers        |
| `POST /api/auth/login` (76223962 / IFL@Admin2025!)         | `200` + `token` JWT            |
| `GET /api/auth/me` avec Bearer token                       | `200` + `is_admin: true`       |

Les six contrôles ci‑dessus ont été exécutés en production après le
déploiement hybride et sont conformes.

---

## 9. Branches Git

| Branche                       | Rôle                                                |
|-------------------------------|-----------------------------------------------------|
| `main`                        | Production (recevra les merges depuis flutter-migration) |
| `nextjs-backup-2026-04-28`    | **Sauvegarde** intégrale du Next.js avant migration  |
| `flutter-migration`           | Travail de migration Flutter (cette branche)         |

---

## 10. Identifiants & contacts

- **Admin** : téléphone `76223962` / mot de passe `IFL@Admin2025!`
- **Orange Money / WhatsApp** : `+226 76 22 39 62`
- **USSD paiement** : `*144*10*76223962#`

---

## 11. Actions explicitement *non* effectuées (contraintes respectées)

- ❌ Aucune exposition de `SUPABASE_SERVICE_ROLE_KEY` côté Flutter
- ❌ Aucune route `/api/*` supprimée
- ❌ Aucune migration / altération de schéma Supabase
- ❌ L'URL `https://ideal-formation-leaders.pages.dev` est inchangée
- ❌ Aucun comportement utilisateur observable n'a été modifié

---

_Migration réalisée le 2026‑04‑28._
