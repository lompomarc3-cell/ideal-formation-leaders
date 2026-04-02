-- ============================================================
-- MIGRATION SQL IFL - Idéal Formation Leaders
-- Supabase Dashboard > SQL Editor > Exécuter ce script
-- ============================================================

-- 1. TABLE PROFILES (authentification par téléphone)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    telephone TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLE CATEGORIES (dossiers principaux)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    type_concours TEXT NOT NULL CHECK (type_concours IN ('direct', 'professionnel')),
    ordre INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE SOUS_CATEGORIES (22 sous-dossiers)
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

-- 4. TABLE QUESTIONS (QCM)
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

-- ============================================================
-- INSERTION DES CATÉGORIES
-- ============================================================

-- Catégorie Concours Direct
INSERT INTO public.categories (id, nom, type_concours, ordre, description)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Concours Direct',
    'direct',
    1,
    'Concours ouverts aux candidats diplômés sans expérience requise'
) ON CONFLICT (id) DO NOTHING;

-- Catégorie Concours Professionnel  
INSERT INTO public.categories (id, nom, type_concours, ordre, description)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Concours Professionnel',
    'professionnel',
    2,
    'Concours réservés aux agents de la Fonction Publique'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INSERTION DES 22 SOUS-CATÉGORIES
-- 10 pour Concours Direct + 12 pour Concours Professionnel
-- ============================================================

-- ===== CONCOURS DIRECT (10 sous-dossiers) =====
INSERT INTO public.sous_categories (nom, categorie_id, type_concours, ordre, description) VALUES
('Culture Générale', '11111111-1111-1111-1111-111111111111', 'direct', 1, 'Histoire, géographie, actualité du Burkina Faso et du monde'),
('Français - Expression Écrite', '11111111-1111-1111-1111-111111111111', 'direct', 2, 'Grammaire, orthographe, conjugaison et rédaction'),
('Mathématiques Générales', '11111111-1111-1111-1111-111111111111', 'direct', 3, 'Arithmétique, algèbre, géométrie et logique'),
('Connaissance de l''Administration', '11111111-1111-1111-1111-111111111111', 'direct', 4, 'Organisation de l''État burkinabè et institutions'),
('Droit Constitutionnel', '11111111-1111-1111-1111-111111111111', 'direct', 5, 'Constitution du Burkina Faso, droits et libertés'),
('Droit Administratif', '11111111-1111-1111-1111-111111111111', 'direct', 6, 'Actes administratifs, contentieux et procédures'),
('Finances Publiques', '11111111-1111-1111-1111-111111111111', 'direct', 7, 'Budget de l''État, loi de finances, comptabilité publique'),
('Informatique et Numérique', '11111111-1111-1111-1111-111111111111', 'direct', 8, 'Outils bureautiques, internet et nouvelles technologies'),
('Développement Durable et Environnement', '11111111-1111-1111-1111-111111111111', 'direct', 9, 'Écologie, changement climatique, développement durable'),
('Logique et Raisonnement', '11111111-1111-1111-1111-111111111111', 'direct', 10, 'Tests psychotechniques, raisonnement logique et aptitudes');

-- ===== CONCOURS PROFESSIONNEL (12 sous-dossiers) =====
INSERT INTO public.sous_categories (nom, categorie_id, type_concours, ordre, description) VALUES
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
('Numérique et Transformation Digitale', '22222222-2222-2222-2222-222222222222', 'professionnel', 12, 'E-gouvernement, services numériques, cybersécurité');

-- ============================================================
-- COMPTE ADMINISTRATEUR NIAMPA ISSA
-- IMPORTANT: Créer d'abord l'utilisateur dans Supabase Auth
-- puis exécuter cette insertion
-- ============================================================
-- NOTE: Le compte admin doit être créé via l'application
-- (inscription avec: Tel: +22676223962, Nom: NIAMPA, Prénom: Issa)
-- Puis mettre à jour le rôle avec cette requête:
-- UPDATE public.profiles SET role = 'admin'
-- WHERE telephone = '+22676223962';

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sous_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- POLICIES PROFILES
CREATE POLICY "Voir son propre profil" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Mettre à jour son profil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Créer son profil" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin voit tous les profils" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'superadmin')
        )
    );

-- POLICIES CATEGORIES (lecture publique, écriture admin)
CREATE POLICY "Lecture publique catégories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Admin gère catégories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'superadmin')
        )
    );

-- POLICIES SOUS_CATEGORIES
CREATE POLICY "Lecture publique sous-catégories" ON public.sous_categories
    FOR SELECT USING (true);

CREATE POLICY "Admin gère sous-catégories" ON public.sous_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'superadmin')
        )
    );

-- POLICIES QUESTIONS
CREATE POLICY "Lecture questions publiées" ON public.questions
    FOR SELECT USING (
        is_published = TRUE
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Admin gère toutes les questions" ON public.questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'superadmin')
        )
    );

-- ============================================================
-- INDEX POUR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sous_categories_type ON public.sous_categories(type_concours);
CREATE INDEX IF NOT EXISTS idx_sous_categories_categorie ON public.sous_categories(categorie_id);
CREATE INDEX IF NOT EXISTS idx_questions_sous_categorie ON public.questions(sous_categorie_id);
CREATE INDEX IF NOT EXISTS idx_questions_published ON public.questions(is_published);
CREATE INDEX IF NOT EXISTS idx_profiles_telephone ON public.profiles(telephone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================
-- TRIGGER: Mise à jour automatique du champ updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT 'Catégories créées: ' || COUNT(*) FROM public.categories;
SELECT 'Sous-catégories créées: ' || COUNT(*) FROM public.sous_categories;
SELECT 'Concours Direct: ' || COUNT(*) FROM public.sous_categories WHERE type_concours = 'direct';
SELECT 'Concours Professionnel: ' || COUNT(*) FROM public.sous_categories WHERE type_concours = 'professionnel';
