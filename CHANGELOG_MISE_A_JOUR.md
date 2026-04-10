# Changelog – Mise à jour IFL (Idéale Formation of Leaders)

## Date : 2025

### Modifications apportées directement sur Supabase

---

## 1. CONCOURS DIRECTS – Passage de 10 à 12 dossiers

**Ajout de 2 nouveaux sous-dossiers :**

| Position | Nom du dossier | Action |
|----------|---------------|--------|
| 9 | **Droit** | Ajouté ✅ |
| 10 | **Économie** | Ajouté ✅ |

**Ordre final (12 dossiers) :**
1. Actualité / Culture Générale
2. Français
3. Littérature et Art
4. H-G (Histoire-Géographie)
5. SVT (Sciences de la Vie et de la Terre)
6. Psychotechniques
7. Matchs (Maths)
8. PC (Physique-Chimie)
9. **Droit** ← AJOUT
10. **Économie** ← AJOUT
11. Entraînement QCM
12. Accompagnement Final

---

## 2. CONCOURS PROFESSIONNELS – Passage de 12 à 17 dossiers

**Actions effectuées :**
- Repositionnement de "Actualités et culture générale" en position 2
- Séparation de "Inspectorat – IES/IEPENF" en deux entrées distinctes :
  - "Inspectorat : IES" (position 4, nouvelle entrée)
  - "Inspectorat : IEPENF" (position 5, ancienne entrée renommée)
- Ajout de **CSAPÉ** en position 6 (nouvelle entrée)
- Repositionnement de Justice (pos 11) et Magistrature (pos 12)
- Harmonisation des noms (casse, ponctuation)

**Ordre final (17 dossiers) :**
1. Spécialités Vie scolaire (CASU-AASU)
2. Actualités et culture générale
3. Spécialités CISU/AISU/ENAREF
4. **Inspectorat : IES** ← NOUVEAU
5. Inspectorat : IEPENF
6. **CSAPÉ** ← NOUVEAU
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

---

## 3. DÉMO – Correction question sur les régions du Burkina Faso

**Question :** "En combien de régions administratives le Burkina Faso est-il divisé ?"

| Champ | Ancienne valeur | Nouvelle valeur |
|-------|----------------|-----------------|
| option_b | 13 régions | **17 régions** |
| reponse_correcte | B | **B** (inchangé) |
| explication | ...13 régions... | **"Le Burkina Faso compte désormais 17 régions suite aux récentes réformes administratives..."** |

---

## Notes techniques

- Toutes les modifications ont été effectuées directement sur la base de données Supabase
- L'ordre d'affichage est géré via le champ `created_at` (tri ascendant) dans l'API
- Aucun fichier source JavaScript/Next.js n'a été modifié
- L'application Cloudflare Pages lit les données en temps réel depuis Supabase → modifications immédiates
- URL de production : https://ideal-formation-leaders.pages.dev ✅

---

*Modifications réalisées le 2025 – Supabase project: cyasoaihjjochwhnhwqf*
