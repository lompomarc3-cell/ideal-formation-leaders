-- FICHIER SQL À EXÉCUTER DANS: https://app.supabase.com/project/cyasoaihjjochwhnhwqf/editor
-- Ce SQL adapte le schéma existant au code Flutter IFL

-- 1. Adapter la table profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS telephone TEXT,
  ADD COLUMN IF NOT EXISTS nom TEXT,
  ADD COLUMN IF NOT EXISTS prenom TEXT;

UPDATE public.profiles SET 
  telephone = phone,
  nom = CASE WHEN full_name LIKE '% %' THEN SPLIT_PART(full_name, ' ', 2) ELSE full_name END,
  prenom = SPLIT_PART(full_name, ' ', 1)
WHERE telephone IS NULL;

-- 2. Adapter la table questions (ajouter colonnes IFL)
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS categorie_id UUID;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS enonce TEXT DEFAULT '';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_a TEXT DEFAULT '';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_b TEXT DEFAULT '';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_c TEXT DEFAULT '';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_d TEXT DEFAULT '';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS reponse_correcte TEXT DEFAULT 'A';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explication TEXT DEFAULT '';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0;

-- 3. Ajouter colonnes manquantes à categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0;

-- 4. TABLE demo_questions
CREATE TABLE IF NOT EXISTS public.demo_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INTEGER NOT NULL,
    enonce TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    reponse_correcte TEXT NOT NULL CHECK (reponse_correcte IN ('A','B','C','D')),
    explication TEXT NOT NULL DEFAULT '',
    categorie TEXT NOT NULL DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT demo_questions_numero_unique UNIQUE (numero)
);
ALTER TABLE public.demo_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_public_read" ON public.demo_questions;
CREATE POLICY "demo_public_read" ON public.demo_questions FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "demo_admin_write" ON public.demo_questions;
CREATE POLICY "demo_admin_write" ON public.demo_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- 5. TABLE paiements
CREATE TABLE IF NOT EXISTS public.paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categorie_id UUID NOT NULL,
    categorie_nom TEXT NOT NULL DEFAULT '',
    montant INTEGER NOT NULL DEFAULT 0,
    statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','valide','refuse')),
    capture_url TEXT,
    numero_om TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    validated_at TIMESTAMPTZ
);
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "paiements_user_read" ON public.paiements;
DROP POLICY IF EXISTS "paiements_user_insert" ON public.paiements;
DROP POLICY IF EXISTS "paiements_admin_all" ON public.paiements;
CREATE POLICY "paiements_user_read" ON public.paiements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "paiements_user_insert" ON public.paiements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "paiements_admin_all" ON public.paiements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- 6. TABLE abonnements
CREATE TABLE IF NOT EXISTS public.abonnements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categorie_id UUID NOT NULL,
    statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif','inactif')),
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, categorie_id)
);
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "abonnements_user_read" ON public.abonnements;
DROP POLICY IF EXISTS "abonnements_admin_all" ON public.abonnements;
CREATE POLICY "abonnements_user_read" ON public.abonnements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "abonnements_admin_all" ON public.abonnements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- 7. INDEX
CREATE INDEX IF NOT EXISTS idx_paiements_user ON public.paiements(user_id);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON public.paiements(statut);
CREATE INDEX IF NOT EXISTS idx_abonnements_user ON public.abonnements(user_id);
CREATE INDEX IF NOT EXISTS idx_abonnements_categorie ON public.abonnements(categorie_id);

-- 8. Mettre admin NIAMPA en superadmin
UPDATE public.profiles SET role='superadmin', full_name='NIAMPA Issa', telephone='+22676223962', nom='NIAMPA', prenom='Issa'
WHERE id = (SELECT id FROM auth.users WHERE email='+22676223962@ifl.app' LIMIT 1);

-- 9. Supprimer les faux comptes (garder seulement admin réel et vrais utilisateurs)
-- SUPPRIMER les comptes de test avec des emails génériques
DELETE FROM auth.users WHERE email IN ('alimata@gmail.com', 'salam.benga@gmail.com') 
  AND created_at > '2026-01-01';

-- 10. QCM Démo
INSERT INTO public.demo_questions (numero,enonce,option_a,option_b,option_c,option_d,reponse_correcte,explication,categorie) VALUES
(1,'Quelle est la capitale du Burkina Faso ?','Bobo-Dioulasso','Ouagadougou','Koudougou','Banfora','B','Ouagadougou est la capitale politique et économique du Burkina Faso.','culture_generale'),
(2,'En quelle année le Burkina Faso a-t-il obtenu son indépendance ?','1958','1962','1960','1965','C','Indépendance le 5 août 1960.','histoire'),
(3,'Quel est le fleuve principal du Burkina Faso ?','Le Niger','La Comoé','Le Mouhoun (Volta Noire)','Le Nakambé','C','Le Mouhoun est le plus long fleuve du Burkina Faso.','geographie'),
(4,'Quelle loi régit les marchés publics au Burkina Faso ?','Loi n°003-2010/AN','Loi n°039-2016/AN','Loi n°12-2005/AN','Loi n°21-2012/AN','B','Loi n°039-2016/AN sur la réglementation des marchés publics.','droit'),
(5,'Quelle institution contrôle a priori les marchés publics ?','Cour des Comptes','ARMP','DGCMEF','Direction commande publique','C','La DGCMEF exerce le contrôle a priori.','marches_publics'),
(6,'Le principe de transparence implique :','Des décisions secrètes','Justification des décisions attribution','Sélection directe','Négociation privée','B','La transparence exige que les décisions soient justifiées.','principes'),
(7,'Quel arrêté porte sur les modalités de rachat au post-primaire ?','Arrêté N°2019-094/MENAPLN/SG/DGEFG','Arrêté N°2025-0063/MESFPT/CB','Arrêté N°2025-010','Arrêté N°2022-062 MENAPLN','A','Arrêté N°2019-094/MENAPLN/SG/DGEFG sur le rachat.','legislation'),
(8,'Quel organe de recours en marchés publics ?','Ministère Économie','ARMP','DGCMEF','Cour des Comptes','B','ARMP traite les recours des soumissionnaires.','marches_publics'),
(9,'La lutte contre la corruption relève du principe de :','Libre concurrence','Moralité','Efficacité','Publicité','B','Le principe de moralité exige l''intégrité.','principes'),
(10,'Quel décret fixe les âges d''entrée dans l''enseignement ?','Décret N°2021-1123','Décret N°2019-0157','Décret N°2009-228/PRES/PM/MASSN/MEBA/MESSRS','Arrêté N°2019-094','C','Décret N°2009-228 fixe les âges d''entrée scolaire.','education')
ON CONFLICT (numero) DO UPDATE SET enonce=EXCLUDED.enonce, reponse_correcte=EXCLUDED.reponse_correcte;
