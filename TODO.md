# IFL — résultats attendus

## Configuration Supabase et connexion admin

- Le serveur utilise l’URL Supabase actuelle, la clé publishable actuelle pour les appels publics et la clé secrète actuelle uniquement côté serveur.
- La normalisation accepte `76223962`, `+22676223962` et les espaces usuels comme le même téléphone.
- Le compte `+22676223962` peut se connecter avec son mot de passe existant et reçoit un rôle `superadmin` exploitable par l’application.
- Les comptes candidats existants continuent d’utiliser le même endpoint de connexion et ne sont pas bloqués par la correction.

## Client Flutter et rôles

- Le client Flutter n’embarque aucune clé secrète Supabase.
- Le même APK conserve les espaces candidat et admin/superadmin selon le rôle renvoyé par l’API.
- Le tableau de bord admin reste protégé par le JWT et le rôle `admin` ou `superadmin`.

## Données et déploiement

- Les tables critiques `profiles`, `correction_requests`, `subscription_plans` et `password_reset_requests` sont vérifiées.
- Les migrations idempotentes nécessaires sont appliquées ou leur absence est documentée.
- Le build hybride conserve les fonctions `/api/*` et le bundle Flutter.
- La production répond en JSON sur les API et en HTML sur l’application Flutter.

## APK et signature

- Le fichier `ifl-keystore.jks` historique est retrouvé et son empreinte correspond à celle fournie avant génération.
- Aucun nouveau keystore n’est créé si le fichier historique est absent.
- L’APK signé et une Release GitHub ne sont annoncés qu’après réussite réelle du build, de la vérification de signature et de la publication.
