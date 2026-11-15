# Plan de réparation IFL

## Périmètre

Réparer le projet existant IFL cloné depuis le dépôt GitHub, sans recréer l’application. Le dépôt est un monorepo Next.js + Flutter : Flutter fournit l’interface mobile/web et Next.js fournit les API Edge consommant Supabase.

## Diagnostic établi

- Le profil `+22676223962` existe dans Supabase et possède le rôle `superadmin`.
- Les tables `profiles`, `correction_requests`, `subscription_plans` et `password_reset_requests` existent.
- Le mot de passe du compte admin fonctionne avec l’identifiant Auth historique en `@ifl.bf`.
- L’endpoint de production `/api/auth/login` renvoie HTTP 500 parce que le serveur utilise encore une ancienne clé Supabase codée en dur alors que les clés du projet ont changé.

## Mise en œuvre

1. Centraliser l’URL Supabase, la clé publishable et la clé secrète dans les variables d’environnement serveur, avec une clé publishable également utilisée par les clients publics.
2. Supprimer les anciennes clés Supabase codées en dur du code Next.js et du client Flutter.
3. Conserver le modèle d’authentification actuel compatible avec les utilisateurs existants : normalisation du téléphone Burkina Faso, profil Supabase, hash applicatif dans `correction_requests`, JWT applicatif et contrôle `admin`/`superadmin`.
4. Configurer les secrets Cloudflare Pages dans les environnements appropriés, compiler le déploiement hybride Next.js + Flutter, puis tester l’API publique, la connexion admin, la connexion utilisateur et les routes protégées.
5. Vérifier la présence du keystore historique exigé avant toute tentative de build APK. Aucun nouveau keystore ne sera créé.

## Structure conservée

- `pages/api/` : API Edge d’authentification, quiz, paiements et administration.
- `lib/` : clients Supabase, JWT, rate limiting et logique partagée.
- `flutter/lib/` : application mobile et web, services API et écrans candidat/admin.
- `flutter/android/` : configuration Android et signature, uniquement si le keystore attendu est retrouvé.
- `build-and-deploy.sh` : build Next.js, build Flutter Web, fusion hybride et déploiement Cloudflare Pages.

## Contraintes de sécurité

Les clés secrètes restent dans Cloudflare Pages et ne sont jamais écrites dans le bundle Flutter, dans le dépôt ou dans les logs. Les migrations sont exécutées uniquement après vérification de leur caractère idempotent et des tables existantes.
