# Import Questions Concours Professionnels — 24 Avril 2026

Import des questions des **17 sous-dossiers des Concours Professionnels** depuis le fichier
`QUESTIONS DANS LOGICIEL1.docx`.

## Résumé

- **213 QCM** insérés dans la table `questions`
- **9 dissertations/études de cas** insérées dans la table `questions` avec `matiere='DISSERTATION'`
- **11 questions à réponses multiples** stockées au format `A,B` ou `A,B,C,D`
- **5 premières questions** de chaque dossier QCM marquées `is_demo=true` (gratuites)
- **Dissertations**: toutes payantes (`is_demo=false`)
- **1 doublon** interne détecté et supprimé dans "Accompagnement final"

## Distribution par dossier

| N° | Sous-dossier | Type | Questions |
|---:|---|:---:|---:|
| 1 | Spécialités Vie scolaire (CASU-AASU) | QCM | 24 |
| 2 | Actualités et culture générale | QCM | 20 |
| 3 | Spécialités CISU/AISU/ENAREF | QCM | 14 |
| 4 | Inspectorat : IES | QCM | 13 |
| 5 | Inspectorat : IEPENF | QCM | 20 |
| 6 | CSAPÉ | Dissertation | 5 |
| 7 | Agrégés | Dissertation | 1 |
| 8 | CAPES toutes options | Dissertation | 1 |
| 9 | Administrateur des hôpitaux | QCM | 10 |
| 10 | Spécialités santé | QCM | 10 |
| 11 | Justice | QCM | 15 |
| 12 | Magistrature | Dissertation | 2 |
| 13 | Spécialités GSP | QCM | 6 |
| 14 | Spécialités police | QCM | 10 |
| 15 | Administrateur civil | QCM | 10 |
| 16 | Entraînement QCM | QCM | 17 |
| 17 | Accompagnement final | QCM | 44 |
| | **TOTAL** | | **222** |

## Schéma utilisé

- Les QCM sont dans `questions` avec `matiere='QCM'`, `reponse_correcte` = `A` / `B` / `C` / `D` ou format multi `A,B,C,D`
- Les dissertations sont dans `questions` avec `matiere='DISSERTATION'`, le corrigé complet dans `option_a`, et `reponse_correcte='A'` (placeholder)
- Le frontend (`pages/quiz/[id].js`) détecte déjà :
  - `matiere === 'DISSERTATION'` → affichage en mode lecture / corrigé complet
  - `bonne_reponse.includes(',')` → gestion des réponses multiples (sélection multiple + validation)
