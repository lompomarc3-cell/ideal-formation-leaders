-- =====================================================================
-- 🆕 MISSION IFL : Sauvegarde du palier de 50 questions (Entraînement QCM)
-- Table : quiz_milestones
-- À exécuter dans Supabase → SQL Editor (ou via psql).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.quiz_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id       UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  question_count  INTEGER NOT NULL DEFAULT 0,
  score_at_50     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes par utilisateur / dossier
CREATE INDEX IF NOT EXISTS idx_quiz_milestones_user
  ON public.quiz_milestones (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_milestones_folder
  ON public.quiz_milestones (folder_id);
CREATE INDEX IF NOT EXISTS idx_quiz_milestones_user_folder
  ON public.quiz_milestones (user_id, folder_id);

-- RLS : la table est écrite uniquement via la SERVICE_ROLE_KEY (API Edge),
-- on active RLS sans policy publique (service_role bypass RLS par défaut).
ALTER TABLE public.quiz_milestones ENABLE ROW LEVEL SECURITY;

-- (Optionnel) Lecture par le propriétaire si l'app cliente lit un jour la table :
DROP POLICY IF EXISTS "milestones_select_own" ON public.quiz_milestones;
CREATE POLICY "milestones_select_own"
  ON public.quiz_milestones
  FOR SELECT
  USING (auth.uid() = user_id);
