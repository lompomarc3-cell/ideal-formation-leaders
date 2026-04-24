-- Table pour les promotions (prix temporaires)
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_concours TEXT NOT NULL CHECK (type_concours IN ('direct', 'professionnel')),
  prix_promo INT NOT NULL CHECK (prix_promo >= 0),
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, type_concours, date_debut, date_fin);
