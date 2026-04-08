-- ================================================================
-- SCRIPT SQL COMPLET POUR LA FINALISATION DU PROJET
-- À exécuter dans : https://app.supabase.com/project/cyasoaihjjochwhnhwqf/sql/new
-- ================================================================

-- ÉTAPE 1 : Supprimer l'ancienne table profiles si elle bloque
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ÉTAPE 2 : Créer la table users avec téléphone comme identifiant
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  abonnement_type TEXT NULL,
  abonnement_valide_jusqua TIMESTAMP NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ÉTAPE 3 : Créer la table categories avec colonne ordre
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  ordre INT NOT NULL,
  type_concours TEXT NOT NULL,
  parent_id UUID NULL REFERENCES categories(id) ON DELETE CASCADE,
  icone TEXT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ÉTAPE 4 : Créer la table questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categorie_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  bonne_reponse CHAR(1) NOT NULL CHECK (bonne_reponse IN ('A','B','C','D')),
  explication TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ÉTAPE 5 : Créer la table user_progress
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  categorie_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  derniere_question_id UUID NULL REFERENCES questions(id),
  score INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, categorie_id)
);

-- ÉTAPE 6 : Créer la table payment_requests
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  montant INT NOT NULL,
  capture_url TEXT NULL,
  valide BOOLEAN DEFAULT FALSE,
  date_demande TIMESTAMP DEFAULT NOW(),
  date_validation TIMESTAMP NULL
);

-- ÉTAPE 7 : Créer la table prix_config
CREATE TABLE IF NOT EXISTS prix_config (
  id SERIAL PRIMARY KEY,
  type_concours TEXT NOT NULL UNIQUE,
  prix INT NOT NULL
);

-- ÉTAPE 8 : Insérer les prix
INSERT INTO prix_config (type_concours, prix) VALUES 
('direct', 5000), 
('professionnel', 20000)
ON CONFLICT (type_concours) DO UPDATE SET prix = EXCLUDED.prix;

-- ÉTAPE 9 : Créer le compte administrateur
-- Note: Le hash du mot de passe IFL@Admin2025! sera généré par l'application
-- Hash bcrypt: $2a$10$... (à générer)
INSERT INTO users (phone, nom, prenom, password_hash, role, is_admin)
VALUES (
  '76223962', 
  'NIAMPA', 
  'Issa', 
  '$2a$10$abcdefghijklmnopqrstuv', -- Ce hash sera remplacé par l'app
  'admin', 
  TRUE
)
ON CONFLICT (phone) DO UPDATE SET 
  nom = 'NIAMPA', 
  prenom = 'Issa', 
  is_admin = TRUE,
  role = 'admin';

-- ÉTAPE 10 : Insérer les 3 nouveaux dossiers professionnels
-- Vérifier d'abord l'ordre actuel:
-- SELECT nom, ordre FROM categories WHERE type_concours = 'professionnel' ORDER BY ordre;

-- Insérer les nouveaux dossiers (adapter les ordres selon les dossiers existants)
INSERT INTO categories (nom, ordre, type_concours, description) VALUES
('Actualités et culture générale', 2, 'professionnel', 'Actualités internationales, culture générale approfondie et enjeux contemporains'),
('Justice', 9, 'professionnel', 'Droit, procédure judiciaire, organisation des tribunaux'),
('Magistrature', 10, 'professionnel', 'Statut des magistrats, carrière, déontologie')
ON CONFLICT DO NOTHING;

-- Si besoin de décaler les ordres des dossiers existants:
-- UPDATE categories SET ordre = ordre + 1 WHERE type_concours = 'professionnel' AND ordre >= 2 AND nom != 'Actualités et culture générale';

-- ÉTAPE 11 : Corriger la question sur les régions du Burkina
UPDATE questions 
SET 
  bonne_reponse = 'B', 
  explication = 'Le Burkina Faso est divisé en 13 régions administratives.'
WHERE 
  question_text ILIKE '%régions%Burkina%'
  OR question_text ILIKE '%Combien de régions%Burkina%';

-- ÉTAPE 12 : Vérification finale
SELECT 'Tables créées' AS statut;
SELECT COUNT(*) AS nb_users FROM users;
SELECT COUNT(*) AS nb_categories FROM categories;
SELECT COUNT(*) AS nb_questions FROM questions;
SELECT nom, ordre, type_concours FROM categories WHERE type_concours = 'professionnel' ORDER BY ordre;
