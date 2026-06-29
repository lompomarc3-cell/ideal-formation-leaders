-- ============================================================
-- SCRIPT SQL – SESSIONS SPÉCIALES IFL
-- À exécuter dans : https://app.supabase.com/project/cyasoaihjjochwhnhwqf/sql/new
-- Date : 2026-06-29
-- ============================================================

-- Table des sessions spéciales
CREATE TABLE IF NOT EXISTS public.special_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'professionnel')),
  dossier_nom TEXT,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  prix INTEGER NOT NULL CHECK (prix >= 0),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  label TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des souscriptions utilisateurs aux sessions spéciales
CREATE TABLE IF NOT EXISTS public.user_special_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.special_sessions(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, session_id)
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_special_sessions_dates ON public.special_sessions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_special_sessions_active ON public.special_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_special_sessions_user ON public.user_special_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_special_sessions_expires ON public.user_special_sessions(expires_at);

-- Activer RLS (Row Level Security)
ALTER TABLE public.special_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_special_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Admins manage special_sessions" ON public.special_sessions;
DROP POLICY IF EXISTS "Users view active special_sessions" ON public.special_sessions;
DROP POLICY IF EXISTS "Users view own user_special_sessions" ON public.user_special_sessions;
DROP POLICY IF EXISTS "Users insert own user_special_sessions" ON public.user_special_sessions;

CREATE POLICY "Admins manage special_sessions" ON public.special_sessions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users view active special_sessions" ON public.special_sessions
  FOR SELECT USING (is_active = true AND end_date > NOW());

CREATE POLICY "Users view own user_special_sessions" ON public.user_special_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own user_special_sessions" ON public.user_special_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_special_sessions_updated_at ON public.special_sessions;
CREATE TRIGGER update_special_sessions_updated_at
  BEFORE UPDATE ON public.special_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Colonnes optionnelles sur profiles pour les sessions spéciales
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_special_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_direct_expires_at TIMESTAMPTZ;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
