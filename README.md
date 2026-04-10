# 🎓 IFL – Idéale Formation of Leaders

**Application web de préparation aux concours du Burkina Faso**

> URL de production : https://ideal-formation-leaders.pages.dev

---

## 📋 Table des matières

- [Description](#description)
- [Structure des dossiers](#structure-des-dossiers)
- [Règle des 5 questions gratuites](#règle-des-5-questions-gratuites)
- [Guide Administrateur](#guide-administrateur)
- [Stack technique](#stack-technique)
- [Liens utiles](#liens-utiles)
- [Changelog](#changelog)

---

## 📖 Description

IFL est une plateforme de QCM en ligne pour la préparation aux concours directs et professionnels du Burkina Faso. Elle permet aux candidats de :

- Découvrir gratuitement 5 questions par dossier **sans créer de compte**
- Accéder à tous les dossiers après abonnement
- S'entraîner sur des milliers de QCM thématiques

---

## 📚 Structure des dossiers

### Concours Directs – 12 dossiers (5 000 FCFA/an)

| N° | Dossier | Icône |
|----|---------|-------|
| 1 | Actualité / Culture générale | 🌍 |
| 2 | Français | 📚 |
| 3 | Littérature et art | 🎨 |
| 4 | H-G (Histoire-Géographie) | 🗺️ |
| 5 | SVT (Sciences de la Vie et de la Terre) | 🧬 |
| 6 | Psychotechniques | 🧠 |
| 7 | Mathématiques | 📐 |
| 8 | PC (Physique-Chimie) | ⚗️ |
| 9 | Droit | ⚖️ |
| 10 | Économie | 💹 |
| 11 | Entraînement QCM | ✏️ |
| 12 | Accompagnement final | 🎯 |

### Concours Professionnels – 17 dossiers (20 000 FCFA/an)

| N° | Dossier | Icône |
|----|---------|-------|
| 1 | Spécialités Vie scolaire (CASU-AASU) | 🏫 |
| 2 | Actualités et culture générale | 📰 |
| 3 | Spécialités CISU/AISU/ENAREF | 🏛️ |
| 4 | Inspectorat : IES | 🔍 |
| 5 | Inspectorat : IEPENF | 🔎 |
| 6 | CSAPÉ | 🎓 |
| 7 | Agrégés | 📜 |
| 8 | CAPES toutes options | 📖 |
| 9 | Administrateur des hôpitaux | 🏥 |
| 10 | Spécialités santé | 💊 |
| 11 | Justice | ⚖️ |
| 12 | Magistrature | 👨‍⚖️ |
| 13 | Spécialités GSP | 🛡️ |
| 14 | Spécialités police | 👮 |
| 15 | Administrateur civil | 📋 |
| 16 | Entraînement QCM | ✏️ |
| 17 | Accompagnement final | 🎯 |

---

## 🆓 Règle des 5 questions gratuites

### Principe fondamental

```
Visiteur non connecté → 5 questions gratuites (is_demo=true) par dossier
Utilisateur connecté sans abonnement → 5 questions gratuites par dossier
Utilisateur abonné → TOUTES les questions du type acheté
Administrateur → TOUTES les questions
```

### Implémentation technique

1. **Page d'accueil publique** (`/`) : affiche les 12+17 dossiers à tous les visiteurs
2. **Page quiz publique** (`/quiz/public/[id]`) : accessible sans connexion, limite aux questions `is_demo=true`
3. **API publique catégories** (`/api/quiz/public-categories`) : pas d'authentification requise
4. **API publique questions** (`/api/quiz/public-questions`) : retourne max 5 questions gratuites

### Dans Supabase

Chaque question dans la table `questions` a un champ `is_demo` (boolean) :
- `is_demo = true` → question gratuite (visible sans connexion)
- `is_demo = false` → question payante (nécessite abonnement)

**Règle** : Les 5 premières questions de chaque dossier doivent avoir `is_demo = true`.

---

## 👑 Guide Administrateur

### Accès

- **URL** : https://ideal-formation-leaders.pages.dev/admin
- **Téléphone** : 76223962
- **Mot de passe** : IFL@Admin2025!

### Ajouter des questions en masse (Import Massif)

1. Aller sur `/admin`
2. Cliquer sur l'onglet **❓ QCM**
3. Cliquer sur **📦 Ajout Massif**
4. Choisir le mode d'import :

#### Mode Texte brut (recommandé pour copier depuis Word)

```
1. Question ici ?
A) Option A  B) Option B
C) Option C  D) Option D
Réponse : A) Option A
Explication : Voici l'explication détaillée.

2. Deuxième question ?
A) Option A  B) Option B
C) Option C  D) Option D
Réponse : B) Option B
Explication : Explication de la 2e question.
```

#### Mode JSON

```json
[
  {
    "enonce": "Question ?",
    "option_a": "Option A",
    "option_b": "Option B",
    "option_c": "Option C",
    "option_d": "Option D",
    "reponse_correcte": "A",
    "explication": "Explication..."
  }
]
```

#### Mode Formulaire

Saisie manuelle, question par question, avec bouton "Ajouter une question".

5. Sélectionner le **dossier cible** dans le menu déroulant
6. Cocher **"Marquer comme questions gratuites"** pour les 5 premières
7. Cliquer **👁️ Aperçu** pour vérifier
8. Cliquer **🚀 Insérer** pour valider

### Valider un paiement

1. Aller sur `/admin`
2. Cliquer sur **💳 Paiements**
3. Trouver la demande en attente
4. Cliquer **✅ Valider & Activer** → l'abonnement s'active immédiatement

### Modifier un utilisateur

1. Aller sur `/admin` → **👥 Utilisateurs**
2. Cliquer ✏️ à côté de l'utilisateur
3. Modifier le type d'abonnement et la date d'expiration
4. Cliquer **✅ Sauvegarder**

---

## 💳 Paiement

- **Orange Money** : `*144*10*76223962#`
- **Bénéficiaire** : +226 76 22 39 62
- **WhatsApp** : https://wa.me/22676223962

---

## 🛠️ Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 13 + React |
| Styles | Tailwind CSS |
| Backend | Cloudflare Pages (Edge Functions) |
| Base de données | Supabase (PostgreSQL) |
| Authentification | JWT custom |
| Déploiement | Cloudflare Pages |

---

## 📊 Base de données Supabase

**Projet ID** : cyasoaihjjochwhnhwqf

### Tables principales

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs (id, full_name, phone, role, subscription_*) |
| `categories` | Dossiers (id, nom, type, question_count, is_active) |
| `questions` | QCM (id, category_id, enonce, option_a/b/c/d, reponse_correcte, is_demo) |
| `correction_requests` | Demandes de paiement |

---

## 🔗 Liens utiles

| Ressource | URL |
|-----------|-----|
| 🌐 Application | https://ideal-formation-leaders.pages.dev |
| ⚙️ Admin | https://ideal-formation-leaders.pages.dev/admin |
| 📊 Supabase | https://app.supabase.com/project/cyasoaihjjochwhnhwqf |
| ☁️ Cloudflare | https://dash.cloudflare.com |
| 💻 GitHub | https://github.com/lompomarc3-cell/ideal-formation-leaders |

---

## 📝 Changelog

### Version 2.0 – Corrections finales et panel admin renforcé

**Date** : Juin 2025

#### 🐛 Corrections bugs

- ✅ **Champ téléphone** : Correction du débordement de conteneur sur mobile et desktop
  - Ajout de `min-width: 0`, `flex-shrink: 0` sur le préfixe `+226`
  - Ajout de `box-sizing: border-box` sur l'input
  - Nouveau CSS `.phone-input-wrapper` dans globals.css

#### ✨ Nouvelles fonctionnalités

- ✅ **Accès public aux dossiers** : Les visiteurs non connectés voient désormais tous les dossiers sur la page d'accueil
- ✅ **5 questions gratuites sans connexion** : Nouvelle page `/quiz/public/[id]` accessible sans authentification
- ✅ **Nouvelles API publiques** :
  - `/api/quiz/public-categories` : catégories sans token
  - `/api/quiz/public-questions` : 5 questions gratuites sans token
- ✅ **Cadenas/message d'invitation** après la 5e question pour les visiteurs non connectés
- ✅ **Import massif amélioré** dans le panel admin (texte, JSON, formulaire)

#### 📊 Mise à jour des données

- ✅ **Nombres de dossiers corrigés** :
  - Concours Directs : 10 → **12 dossiers thématiques**
  - Concours Professionnels : 15 → **17 dossiers spécialisés**
- ✅ **10 nouvelles questions de Français** ajoutées :
  - 5 questions gratuites (is_demo=true)
  - 5 questions payantes (is_demo=false)
- ✅ **0 doublon** vérifié dans la base de données (145 questions uniques)

#### 🔧 Corrections techniques

- ✅ Page d'accueil : onglets Directs/Professionnels pour naviguer entre les dossiers
- ✅ Page quiz/[id].js : redirection vers quiz public pour les visiteurs non connectés
- ✅ Bouton USSD : alerte de confirmation après copie
- ✅ WhatsApp : liens corrects sur toutes les pages (+22676223962)
- ✅ Téléphone : `tel:+22676223962` cliquable sur toutes les pages de paiement

---

## 📞 Contact

- **WhatsApp** : +226 76 22 39 62
- **Orange Money** : 76 22 39 62
