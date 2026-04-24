-- ===============================================================
-- IFL — Phase 2 : Table des promotions (à exécuter dans Supabase
-- Dashboard → SQL Editor → New query → Run).
-- ===============================================================

-- 1. Création de la table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_concours TEXT NOT NULL CHECK (type_concours IN ('direct', 'professionnel')),
  prix_promo INT NOT NULL CHECK (prix_promo >= 0),
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index pour les requêtes "promotion active courante"
CREATE INDEX IF NOT EXISTS idx_promotions_active
  ON public.promotions(is_active, type_concours, date_debut, date_fin);

-- 3. Politiques RLS (lecture publique pour afficher le prix barré, écriture admin via service_role)
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_public_read" ON public.promotions;
CREATE POLICY "promotions_public_read" ON public.promotions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "promotions_service_role_all" ON public.promotions;
CREATE POLICY "promotions_service_role_all" ON public.promotions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Vérification
SELECT 'OK – Table promotions prête.' AS status;
