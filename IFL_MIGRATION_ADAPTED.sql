-- =====================================================================
-- IFL - MIGRATION SQL ADAPTÉE AU VRAI SCHÉMA
-- URL: https://app.supabase.com/project/cyasoaihjjochwhnhwqf/editor
-- EXÉCUTER CE SCRIPT EN ENTIER DANS LE SQL EDITOR DE SUPABASE
-- =====================================================================

-- TABLE: demo_questions (QCM gratuits pour la démo)
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT demo_questions_numero_unique UNIQUE (numero)
);

ALTER TABLE public.demo_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_public_read" ON public.demo_questions;
CREATE POLICY "demo_public_read" ON public.demo_questions 
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "demo_admin_write" ON public.demo_questions;
CREATE POLICY "demo_admin_write" ON public.demo_questions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- TABLE: paiements (demandes de paiement Orange Money)
CREATE TABLE IF NOT EXISTS public.paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categorie_id UUID NOT NULL,
    categorie_nom TEXT NOT NULL DEFAULT '',
    montant INTEGER NOT NULL DEFAULT 0,
    statut TEXT NOT NULL DEFAULT 'en_attente' 
        CHECK (statut IN ('en_attente', 'valide', 'refuse')),
    capture_url TEXT,
    numero_om TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    validated_at TIMESTAMPTZ
);

ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "paiements_user_read" ON public.paiements;
DROP POLICY IF EXISTS "paiements_user_insert" ON public.paiements;
DROP POLICY IF EXISTS "paiements_admin_all" ON public.paiements;

CREATE POLICY "paiements_user_read" ON public.paiements 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "paiements_user_insert" ON public.paiements 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "paiements_admin_all" ON public.paiements 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- TABLE: abonnements (accès débloqués après paiement validé)
CREATE TABLE IF NOT EXISTS public.abonnements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categorie_id UUID NOT NULL,
    statut TEXT NOT NULL DEFAULT 'actif' 
        CHECK (statut IN ('actif', 'inactif')),
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, categorie_id)
);

ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "abonnements_user_read" ON public.abonnements;
DROP POLICY IF EXISTS "abonnements_admin_all" ON public.abonnements;

CREATE POLICY "abonnements_user_read" ON public.abonnements 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "abonnements_admin_all" ON public.abonnements 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- COLONNES MANQUANTES dans categories (si pas déjà présentes)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0;

-- INDEX PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_paiements_user ON public.paiements(user_id);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON public.paiements(statut);
CREATE INDEX IF NOT EXISTS idx_abonnements_user ON public.abonnements(user_id);
CREATE INDEX IF NOT EXISTS idx_abonnements_categorie ON public.abonnements(categorie_id);
CREATE INDEX IF NOT EXISTS idx_demo_questions_active ON public.demo_questions(is_active);

-- =====================================================================
-- INSÉRER LES 10 QCM DE DÉMONSTRATION
-- =====================================================================
INSERT INTO public.demo_questions (numero, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, categorie) VALUES
(1, 'Quelle est la capitale du Burkina Faso ?', 
 'Bobo-Dioulasso', 'Ouagadougou', 'Koudougou', 'Banfora',
 'B', 'Ouagadougou est la capitale politique et économique du Burkina Faso.', 'culture_generale'),
 
(2, 'En quelle année le Burkina Faso a-t-il obtenu son indépendance ?',
 '1958', '1962', '1960', '1965',
 'C', 'La Haute-Volta (actuel Burkina Faso) a obtenu son indépendance de la France le 5 août 1960.', 'histoire'),

(3, 'Quel est le fleuve principal du Burkina Faso ?',
 'Le Niger', 'La Comoé', 'Le Mouhoun (Volta Noire)', 'Le Nakambé',
 'C', 'Le Mouhoun, anciennement Volta Noire, est le plus long fleuve du Burkina Faso.', 'geographie'),

(4, 'Quelle est la loi qui régit les marchés publics au Burkina Faso ?',
 'Loi n°003-2010/AN', 'Loi n°039-2016/AN', 'Loi n°12-2005/AN', 'Loi n°21-2012/AN',
 'B', 'La loi n°039-2016/AN portant réglementation générale des marchés publics encadre la commande publique.', 'droit'),

(5, 'Quelle institution est chargée du contrôle a priori des marchés publics ?',
 'Cour des Comptes', 'ARMP', 'DGCMEF', 'Direction de la commande publique',
 'C', 'La DGCMEF (Direction Générale du Contrôle des Marchés Publics et des Engagements Financiers) exerce ce contrôle.', 'marches_publics'),

(6, 'Le principe de transparence dans les marchés publics implique :',
 'Des décisions secrètes', 'La justification des décisions d''attribution', 'Une sélection directe', 'Une négociation privée',
 'B', 'La transparence exige que toutes les décisions soient justifiées, documentées et contrôlables.', 'principes'),

(7, 'Quel arrêté porte sur les modalités de rachat dans les enseignements post-primaire et secondaire ?',
 'Arrêté N°2019-094/MENAPLN/SG/DGEFG', 'Arrêté N°2025-0063/MESFPT/CB', 'Arrêté N°2025-010 MEEA/MESFPT/MESRI', 'Arrêté N°2022-062 MENAPLN',
 'A', 'L''arrêté N°2019-094/MENAPLN/SG/DGEFG définit les modalités de rachat au post-primaire et secondaire.', 'legislation'),

(8, 'Quel est l''organe de recours en matière de marchés publics au Burkina Faso ?',
 'Ministère de l''Économie', 'ARMP', 'DGCMEF', 'Cour des Comptes',
 'B', 'L''ARMP (Autorité de Régulation de la Commande Publique) reçoit et traite les recours.', 'marches_publics'),

(9, 'La lutte contre la corruption est directement liée au principe de :',
 'Libre concurrence', 'Moralité', 'Efficacité', 'Publicité',
 'B', 'Le principe de moralité exige l''intégrité dans toutes les procédures administratives.', 'principes'),

(10, 'Quel décret fixe les âges d''entrée aux différents niveaux d''enseignement au Burkina Faso ?',
 'Décret N°2021-1123', 'Décret N°2019-0157', 'Décret N°2009-228/PRES/PM/MASSN/MEBA/MESSRS', 'Arrêté N°2019-094',
 'C', 'Le décret N°2009-228 fixe les âges d''entrée dans les différents niveaux d''enseignement.', 'education')
ON CONFLICT (numero) DO UPDATE SET
    enonce = EXCLUDED.enonce,
    option_a = EXCLUDED.option_a,
    option_b = EXCLUDED.option_b,
    option_c = EXCLUDED.option_c,
    option_d = EXCLUDED.option_d,
    reponse_correcte = EXCLUDED.reponse_correcte,
    explication = EXCLUDED.explication;

-- =====================================================================
-- PROMOUVOIR NIAMPA ISSA COMME SUPERADMIN
-- ID: e0443772-bc48-4077-8868-e9f7474e20df
-- =====================================================================
UPDATE public.profiles 
SET role = 'superadmin', full_name = 'NIAMPA Issa'
WHERE phone = '+22676223962' OR id = 'e0443772-bc48-4077-8868-e9f7474e20df';

-- Rétrograder l'ancien admin fictif
UPDATE public.profiles 
SET role = 'user'
WHERE phone = '+22600000000' AND full_name = 'Admin IFL';

-- =====================================================================
-- VÉRIFICATIONS FINALES
-- =====================================================================
SELECT 'Tables créées:' as info, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('categories', 'questions', 'demo_questions', 'paiements', 'abonnements', 'profiles');

SELECT 'Catégories Direct:' as info, COUNT(*) as total FROM public.categories WHERE type = 'direct';
SELECT 'Catégories Pro:' as info, COUNT(*) as total FROM public.categories WHERE type = 'professionnel';
SELECT 'QCM Démo:' as info, COUNT(*) as total FROM public.demo_questions;

SELECT 'Admin NIAMPA:' as info, id, full_name, phone, role 
FROM public.profiles 
WHERE phone = '+22676223962';
