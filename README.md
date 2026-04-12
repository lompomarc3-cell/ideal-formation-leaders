# IFL – Idéale Formation of Leaders

**Application de préparation aux concours du Burkina Faso**

🌐 **URL Production** : https://ideal-formation-leaders.pages.dev

---

## 📋 Mise à jour v2.0 – Juillet 2025

### ✅ Fonctionnalités ajoutées / corrigées

1. **🎬 Écran de démarrage** – Logo animé (fade + scale + pulsation) pendant 2,8 secondes avant l'accueil
2. **📱 Champ téléphone** – Correction du débordement UI sur mobile (connexion et inscription)
3. **🗺️ 17 régions** – Question démo mise à jour : bonne réponse D=17, explication détaillée (réforme du 2 juillet 2025)
4. **💾 Progression utilisateur** – Reprise automatique à la dernière question visitée (localStorage + Supabase)
5. **⬅️➡️ Flèches navigation** – Boutons Précédente/Suivante avec compteur "Question X sur Y"
6. **🔑 Changement mot de passe admin** – Onglet dédié dans le panneau administrateur
7. **💰 Prix sans "par an"** – Affichage "5 000 FCFA" et "20 000 FCFA" sans mention annuelle
8. **ℹ️ Section À propos** – Onglet dans la navigation principale avec 3 sous-onglets :
   - À propos de l'application
   - À propos de notre équipe (contact cliquable)
   - À propos du développeur (Marc LOMPO, contact cliquable)
9. **🆓 5 questions gratuites** – Accès sans connexion aux 5 premières questions de chaque dossier
10. **🧹 Doublons** – Vérification : 0 doublon trouvé sur 155 questions
11. **📦 Import massif** – Interface BulkQCMAdd améliorée (texte brut, JSON, formulaire, aperçu)
12. **🚀 Déploiement** – Cloudflare Pages, cache purgé, URL production active

---

## 🏗️ Architecture

- **Framework** : Next.js (Edge Runtime)
- **Base de données** : Supabase (PostgreSQL)
- **Hébergement** : Cloudflare Pages
- **Authentification** : JWT + SHA-256

## 📊 Structure des dossiers

### Concours Directs (12 dossiers)
1. Actualité / Culture générale
2. Français
3. Littérature et art
4. Histoire-Géographie
5. SVT
6. Psychotechniques
7. Maths
8. Physique-Chimie
9. Droit
10. Économie
11. Entraînement QCM
12. Accompagnement final

### Concours Professionnels (17 dossiers)
1. Spécialités Vie scolaire (CASU-AASU)
2. Actualités et culture générale
3. Spécialités CISU/AISU/ENAREF
4. Inspectorat : IES
5. Inspectorat : IEPENF
6. CSAPÉ
7. Agrégés
8. CAPES toutes options
9. Administrateur des hôpitaux
10. Spécialités santé
11. Justice
12. Magistrature
13. Spécialités GSP
14. Spécialités police
15. Administrateur civil
16. Entraînement QCM
17. Accompagnement final

## 💳 Tarifs
- Concours Directs : **5 000 FCFA**
- Concours Professionnels : **20 000 FCFA**

## 📱 Paiement
- Orange Money : `*144*10*76223962#`
- WhatsApp : +226 76 22 39 62

## 👤 Contact développeur
- **Marc LOMPO** – Ingénieur Digital
- WhatsApp : +226 72 66 21 61

---

*© 2025 IFL – Idéale Formation of Leaders – Burkina Faso*
