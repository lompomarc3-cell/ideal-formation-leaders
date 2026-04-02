-- ============================================================
-- MIGRATION SQL COMPLÈTE IFL - À EXÉCUTER DANS SQL EDITOR SUPABASE
-- URL: https://app.supabase.com/project/cyasoaihjjochwhnhwqf/editor
-- ============================================================
-- ÉTAPES:
-- 1. Copier tout ce fichier
-- 2. Aller sur https://app.supabase.com/project/cyasoaihjjochwhnhwqf/editor
-- 3. Coller et exécuter
-- ============================================================

-- ============================================================
-- STEP 0: SUPPRIMER LES POLICIES RÉCURSIVES
-- ============================================================

-- Supprimer toutes les policies existantes pour éviter conflits
DROP POLICY IF EXISTS "Voir son propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Mettre à jour son profil" ON public.profiles;
DROP POLICY IF EXISTS "Créer son profil" ON public.profiles;
DROP POLICY IF EXISTS "Admin voit tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Lecture publique catégories" ON public.categories;
DROP POLICY IF EXISTS "Admin gère catégories" ON public.categories;
DROP POLICY IF EXISTS "Lecture publique sous-catégories" ON public.sous_categories;
DROP POLICY IF EXISTS "Admin gère sous-catégories" ON public.sous_categories;
DROP POLICY IF EXISTS "Lecture questions publiées" ON public.questions;
DROP POLICY IF EXISTS "Admin gère toutes les questions" ON public.questions;
DROP POLICY IF EXISTS "Lecture publique demo_questions" ON public.demo_questions;
DROP POLICY IF EXISTS "Tout le monde peut lire demo" ON public.demo_questions;

-- ============================================================
-- STEP 1: RECRÉER LES TABLES AVEC LE BON SCHÉMA
-- ============================================================

-- TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    telephone TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes manquantes à categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS type_concours TEXT CHECK (type_concours IN ('direct', 'professionnel')),
ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- TABLE SOUS_CATEGORIES
CREATE TABLE IF NOT EXISTS public.sous_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    type_concours TEXT NOT NULL CHECK (type_concours IN ('direct', 'professionnel')),
    ordre INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sous_categorie_id UUID NOT NULL REFERENCES public.sous_categories(id) ON DELETE CASCADE,
    enonce TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    explication TEXT NOT NULL DEFAULT '',
    ordre INTEGER DEFAULT 0,
    auteur_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE DEMO_QUESTIONS (QCM gratuits accessible sans inscription)
CREATE TABLE IF NOT EXISTS public.demo_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INTEGER NOT NULL,
    enonce TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    reponse_correcte TEXT NOT NULL CHECK (reponse_correcte IN ('A', 'B', 'C', 'D')),
    explication TEXT NOT NULL DEFAULT '',
    categorie TEXT NOT NULL DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 2: ACTIVER RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sous_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_questions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: CRÉER UNE FONCTION HELPER POUR ÉVITER LA RÉCURSION
-- ============================================================

-- Fonction pour récupérer le rôle sans récursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

-- ============================================================
-- STEP 4: POLICIES SANS RÉCURSION
-- ============================================================

-- POLICIES PROFILES (sans récursion)
CREATE POLICY "profile_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

CREATE POLICY "profile_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profile_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

CREATE POLICY "profile_delete_admin" ON public.profiles
    FOR DELETE USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- POLICIES CATEGORIES (lecture publique)
CREATE POLICY "categories_select_all" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "categories_write_admin" ON public.categories
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- POLICIES SOUS_CATEGORIES (lecture publique)
CREATE POLICY "sous_categories_select_all" ON public.sous_categories
    FOR SELECT USING (true);

CREATE POLICY "sous_categories_write_admin" ON public.sous_categories
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- POLICIES QUESTIONS
CREATE POLICY "questions_select_published" ON public.questions
    FOR SELECT USING (
        is_published = TRUE
        OR public.get_user_role(auth.uid()) IN ('admin', 'superadmin')
    );

CREATE POLICY "questions_write_admin" ON public.questions
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- POLICIES DEMO_QUESTIONS (lecture publique totale, pas besoin d'auth)
CREATE POLICY "demo_questions_public_read" ON public.demo_questions
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "demo_questions_admin_write" ON public.demo_questions
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- ============================================================
-- STEP 5: TRIGGER UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trigger_questions_updated_at ON public.questions;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STEP 6: INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sous_categories_type ON public.sous_categories(type_concours);
CREATE INDEX IF NOT EXISTS idx_sous_categories_categorie ON public.sous_categories(categorie_id);
CREATE INDEX IF NOT EXISTS idx_questions_sous_categorie ON public.questions(sous_categorie_id);
CREATE INDEX IF NOT EXISTS idx_questions_published ON public.questions(is_published);
CREATE INDEX IF NOT EXISTS idx_profiles_telephone ON public.profiles(telephone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_demo_questions_numero ON public.demo_questions(numero);
CREATE INDEX IF NOT EXISTS idx_demo_questions_active ON public.demo_questions(is_active);

-- ============================================================
-- STEP 7: INSÉRER LES CATÉGORIES
-- ============================================================

INSERT INTO public.categories (id, nom, type_concours, ordre, description)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Concours Direct', 'direct', 1, 'Concours ouverts aux candidats diplômés sans expérience requise'),
    ('22222222-2222-2222-2222-222222222222', 'Concours Professionnel', 'professionnel', 2, 'Concours réservés aux agents de la Fonction Publique')
ON CONFLICT (id) DO UPDATE SET 
    type_concours = EXCLUDED.type_concours,
    ordre = EXCLUDED.ordre,
    description = EXCLUDED.description;

-- ============================================================
-- STEP 8: INSÉRER LES 22 SOUS-CATÉGORIES
-- ============================================================

-- Concours Direct (10 sous-dossiers)
INSERT INTO public.sous_categories (nom, categorie_id, type_concours, ordre, description)
VALUES
    ('Culture Générale', '11111111-1111-1111-1111-111111111111', 'direct', 1, 'Histoire, géographie, actualité du Burkina Faso et du monde'),
    ('Français - Expression Écrite', '11111111-1111-1111-1111-111111111111', 'direct', 2, 'Grammaire, orthographe, conjugaison et rédaction'),
    ('Mathématiques Générales', '11111111-1111-1111-1111-111111111111', 'direct', 3, 'Arithmétique, algèbre, géométrie et logique'),
    ('Connaissance de l''Administration', '11111111-1111-1111-1111-111111111111', 'direct', 4, 'Organisation de l''État burkinabè et institutions'),
    ('Droit Constitutionnel', '11111111-1111-1111-1111-111111111111', 'direct', 5, 'Constitution du Burkina Faso, droits et libertés'),
    ('Droit Administratif', '11111111-1111-1111-1111-111111111111', 'direct', 6, 'Actes administratifs, contentieux et procédures'),
    ('Finances Publiques', '11111111-1111-1111-1111-111111111111', 'direct', 7, 'Budget de l''État, loi de finances, comptabilité publique'),
    ('Informatique et Numérique', '11111111-1111-1111-1111-111111111111', 'direct', 8, 'Outils bureautiques, internet et nouvelles technologies'),
    ('Développement Durable et Environnement', '11111111-1111-1111-1111-111111111111', 'direct', 9, 'Écologie, changement climatique, développement durable'),
    ('Logique et Raisonnement', '11111111-1111-1111-1111-111111111111', 'direct', 10, 'Tests psychotechniques, raisonnement logique et aptitudes')
ON CONFLICT DO NOTHING;

-- Concours Professionnel (12 sous-dossiers)
INSERT INTO public.sous_categories (nom, categorie_id, type_concours, ordre, description)
VALUES
    ('Statut Général de la Fonction Publique', '22222222-2222-2222-2222-222222222222', 'professionnel', 1, 'Droits et obligations des fonctionnaires, carrière'),
    ('Droit du Travail et Social', '22222222-2222-2222-2222-222222222222', 'professionnel', 2, 'Code du travail, protection sociale, retraite'),
    ('Management et Administration Publique', '22222222-2222-2222-2222-222222222222', 'professionnel', 3, 'Gestion des ressources humaines, organisation administrative'),
    ('Comptabilité et Gestion Budgétaire', '22222222-2222-2222-2222-222222222222', 'professionnel', 4, 'Comptabilité générale, gestion budgétaire et financière'),
    ('Marchés Publics et Délégation', '22222222-2222-2222-2222-222222222222', 'professionnel', 5, 'Code des marchés publics, procédures de passation'),
    ('Droit Pénal et Éthique', '22222222-2222-2222-2222-222222222222', 'professionnel', 6, 'Déontologie, éthique professionnelle, infractions pénales'),
    ('Relations Internationales et Diplomatie', '22222222-2222-2222-2222-222222222222', 'professionnel', 7, 'Organisations internationales, diplomatie africaine'),
    ('Économie Générale et Développement', '22222222-2222-2222-2222-222222222222', 'professionnel', 8, 'Macro et microéconomie, politiques économiques du Burkina'),
    ('Planification et Décentralisation', '22222222-2222-2222-2222-222222222222', 'professionnel', 9, 'Plans nationaux de développement, collectivités locales'),
    ('Rédaction Administrative', '22222222-2222-2222-2222-222222222222', 'professionnel', 10, 'Note de service, rapport, compte-rendu, correspondance'),
    ('Fiscalité et Douanes', '22222222-2222-2222-2222-222222222222', 'professionnel', 11, 'Impôts et taxes, code général des impôts, douanes'),
    ('Numérique et Transformation Digitale', '22222222-2222-2222-2222-222222222222', 'professionnel', 12, 'E-gouvernement, services numériques, cybersécurité')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 9: INSÉRER LES 20 QCM DÉMO
-- ============================================================

INSERT INTO public.demo_questions (numero, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, categorie)
VALUES
(1, 'Quel arrêté porte création de clubs écologiques au sein des établissements d''enseignement ?', 
 'Arrêté N°2025-010 MEEA/ MESFPT/ MESRI', 'Arrêté N°2025-24/ MEBAPLN/SG/DRH', 
 'Arrêté N°2024-0304/ MENAPLN/ SG/ DGEC', 'Arrêté N°2025-176/ MESRI/ CAB',
 'A', 'Cet arrêté interministériel vise à instaurer des clubs écologiques dans les lycées, collèges et centres de formation.', 'legislation'),

(2, 'Quel arrêté proroge la validité des attestations de succès au BEPC, BEP et CAP session 2023 ?',
 'Arrêté N°2023-177/ MEFP/ MENAPLN', 'Arrêté N°2024-0304/ MENAPLN/ SG / DGEC',
 'Arrêté N°2025-0063/ MESFPT/CB', 'Arrêté N°2021-0214/ PRESE/PM/MATD/MINEFID/MENAPLN',
 'B', 'Cet arrêté de 2024 prolonge la validité des attestations de succès de la session 2023.', 'legislation'),

(3, 'Quel arrêté fixe les taux de prise en charge et indemnités diverses pour l''organisation des examens et concours scolaires ?',
 'Arrêté N°2025-24/ MEBAPLN/SG/DRH', 'Arrêté conjoint N°2023-177/ MEFP/ MENAPLN',
 'Arrêté N°2025-176/ MESRI/ CAB', 'Arrêté N°2019-094/ MENAPLN/ SG/DGEFG',
 'B', 'Cet arrêté conjoint de 2023 fixe les taux et indemnités liés aux examens et concours scolaires.', 'legislation'),

(4, 'Quel décret fixe les âges d''entrée aux différents niveaux d''enseignement au Burkina Faso ?',
 'Décret N°2021-1123/ PRES/ PM/ MINEFID/ MENAPLN/ MESRI', 'Décret N°2019-0157/ PRES/PM/ MENA',
 'Décret N°2009-228/ PRES/PM MASSN/MEBA/MESSRS', 'Arrêté N°2019-094/ MENAPLN/ SG/DGEFG',
 'C', 'Ce décret de 2009 fixe les âges d''entrée du préscolaire au supérieur.', 'legislation'),

(5, 'Quel arrêté porte modalité de rachat dans les enseignements post-primaire et secondaire ?',
 'Arrêté N°2019-094/ MENAPLN/ SG /DGEFG', 'Arrêté N°2025-0063/ MESFPT/CB',
 'Arrêté N°2025-010 MEEA/ MESFPT/ MESRI', 'Arrêté N°2022-062 MENAPLN/SG/DGD-LSCPA',
 'A', 'Cet arrêté de 2019 définit les modalités de rachat au post-primaire et au secondaire.', 'legislation'),

(6, 'Quelle est la loi qui régit les marchés publics au Burkina Faso ?',
 'Loi n°003-2010/AN', 'Loi n°039-2016/AN', 'Loi n°12-2005/AN', 'Loi n°21-2012/AN',
 'B', 'La loi n°039-2016/AN portant réglementation générale des marchés publics et des délégations de service public encadre la commande publique au Burkina Faso.', 'marches_publics'),

(7, 'Quelle institution est chargée du contrôle a priori des marchés publics ?',
 'Cour des Comptes', 'ARMP', 'DGCMEF', 'Direction de la commande publique',
 'C', 'La Direction Générale du Contrôle des Marchés Publics et des Engagements Financiers (DGCMEF) exerce le contrôle a priori sur les marchés.', 'marches_publics'),

(8, 'Quel est l''organe de recours en matière de marchés publics ?',
 'Ministère de l''Économie', 'ARMP', 'DGCMEF', 'Cour des Comptes',
 'B', 'L''Autorité de Régulation de la Commande Publique (ARMP) reçoit et traite les recours des candidats ou soumissionnaires.', 'marches_publics'),

(9, 'Quel est le seuil de passation en appel d''offres ouvert pour les marchés de travaux ?',
 '50 millions FCFA', '100 millions FCFA', '200 millions FCFA', '300 millions FCFA',
 'C', 'Pour les marchés de travaux, le seuil à partir duquel un appel d''offres ouvert est obligatoire est de 200 millions FCFA.', 'marches_publics'),

(10, 'Quelle procédure est utilisée pour les marchés de faible montant ?',
 'Appel d''offres restreint', 'Demande de prix', 'Appel d''offres ouvert', 'Gré à gré',
 'B', 'La demande de prix est la procédure simplifiée utilisée pour les petits montants en dessous des seuils fixés.', 'marches_publics'),

(11, 'Quel principe impose la justification des décisions d''attribution ?',
 'Transparence', 'Confidentialité', 'Sélectivité', 'Moralité',
 'A', 'Les décisions doivent pouvoir être expliquées et contrôlées selon le principe de transparence.', 'principes'),

(12, 'La lutte contre la corruption est directement liée au principe de :',
 'Libre concurrence', 'Moralité', 'Efficacité', 'Publicité',
 'B', 'Le principe de moralité exige l''intégrité dans toutes les procédures.', 'principes'),

(13, 'Quel principe garantit l''accès équitable à l''information sur les marchés ?',
 'Égalité de traitement', 'Transparence', 'Efficacité', 'Performance',
 'B', 'L''information doit être diffusée de façon claire et ouverte selon le principe de transparence.', 'principes'),

(14, 'Le principe de libre concurrence suppose :',
 'Des critères flous', 'Une publicité suffisante', 'Une sélection directe', 'Une négociation secrète',
 'B', 'Sans information, il ne peut y avoir de concurrence réelle. La publicité suffisante est donc indispensable.', 'principes'),

(15, 'L''application simultanée des principes des marchés publics vise surtout à :',
 'Complexifier les procédures', 'Sécuriser la commande publique', 'Favoriser l''administration', 'Retarder les projets',
 'B', 'Ces principes garantissent légalité, équité et efficacité pour sécuriser la commande publique.', 'principes'),

(16, 'Quelle institution nationale vérifie la gestion des fonds issus des marchés publics ?',
 'ARCOP', 'Cour des comptes', 'DG-CMP', 'Ministère du Commerce',
 'B', 'La Cour des comptes assure le contrôle juridictionnel des finances publiques.', 'controle'),

(17, 'Quel seuil approximatif est souvent utilisé pour les marchés de fournitures avant l''appel d''offres ?',
 '10 millions FCFA', '25 millions FCFA', '75 millions FCFA', '300 millions FCFA',
 'B', 'Ce seuil de 25 millions FCFA sert généralement de limite pour certaines procédures simplifiées.', 'seuils'),

(18, 'Quel seuil déclenche généralement l''appel d''offres international ?',
 '10 millions FCFA', '50 millions FCFA', '500 millions FCFA', '5 milliards FCFA',
 'C', 'Les montants très élevés (500 millions FCFA et plus) nécessitent souvent une concurrence internationale.', 'seuils'),

(19, 'Pour les prestations intellectuelles, quel seuil peut conduire à la sélection basée sur la qualité et le coût ?',
 '5 millions FCFA', '10 millions FCFA', '25 millions FCFA', '200 millions FCFA',
 'C', 'Ce seuil de 25 millions FCFA peut déclencher des procédures spécifiques pour les consultants.', 'seuils'),

(20, 'Quelle entité administrative est chargée du contrôle a priori de la commande publique au Burkina Faso ?',
 'ARMP', 'Autorité contractante', 'Direction générale du contrôle des marchés publics (DGCMP)', 'Cour des comptes',
 'C', 'La DGCMP exerce le contrôle administratif préalable sur les procédures de passation des marchés publics.', 'controle')

ON CONFLICT (numero) DO UPDATE SET
    enonce = EXCLUDED.enonce,
    option_a = EXCLUDED.option_a,
    option_b = EXCLUDED.option_b,
    option_c = EXCLUDED.option_c,
    option_d = EXCLUDED.option_d,
    reponse_correcte = EXCLUDED.reponse_correcte,
    explication = EXCLUDED.explication;

-- ============================================================
-- STEP 10: CRÉER LE COMPTE NIAMPA (Après s'être inscrit dans l'app)
-- ============================================================
-- IMPORTANT: D'abord s'inscrire dans l'app avec:
--   Prénom: Issa, Nom: NIAMPA, Tél: +22676223962, MDP: NIAMPA@IFL2025!
-- Puis exécuter cette requête:
-- UPDATE public.profiles SET role = 'admin' WHERE telephone = '+22676223962';

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT 'Catégories créées: ' || COUNT(*) as result FROM public.categories;
SELECT 'Sous-catégories créées: ' || COUNT(*) as result FROM public.sous_categories;
SELECT 'QCM Démo créées: ' || COUNT(*) as result FROM public.demo_questions;
SELECT 'Questions payantes: ' || COUNT(*) as result FROM public.questions;
