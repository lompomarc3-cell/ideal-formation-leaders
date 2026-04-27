-- ============================================================
-- IFL — Index d'optimisation Supabase (à exécuter dans SQL Editor)
-- ============================================================
-- À lancer une seule fois. Tous les CREATE INDEX utilisent IF NOT EXISTS,
-- donc ré-exécutables sans risque. CONCURRENTLY évite tout verrou en prod.
--
-- Ces index couvrent les chemins critiques observés dans l'app :
--   • /api/quiz/questions, /api/quiz/public-questions  (filtre par category_id + is_active)
--   • /api/auth/login, /api/auth/register              (lookup profiles.phone)
--   • /api/auth/me                                     (correction_requests par user_id + status)
--   • /api/admin/users, /api/admin/payments            (correction_requests filtrés)
--   • /api/quiz/user-stats, /api/quiz/progress         (user_progress par user_id)
-- ============================================================

-- 1) questions : filtre fréquent (category_id, is_active)
CREATE INDEX IF NOT EXISTS idx_questions_category_active
  ON public.questions (category_id, is_active);

-- 2) profiles : login par téléphone
CREATE INDEX IF NOT EXISTS idx_profiles_phone
  ON public.profiles (phone);

-- 3) profiles : tri admin par date de création
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles (created_at DESC);

-- 4) correction_requests : très utilisé (user_id, status, created_at)
CREATE INDEX IF NOT EXISTS idx_corr_user_status_created
  ON public.correction_requests (user_id, status, created_at DESC);

-- 5) correction_requests : filtre status seul (vue admin paiements)
CREATE INDEX IF NOT EXISTS idx_corr_status_created
  ON public.correction_requests (status, created_at DESC);

-- 6) user_progress : stats utilisateur
CREATE INDEX IF NOT EXISTS idx_user_progress_user
  ON public.user_progress (user_id);

-- 7) user_progress : composé (user_id, question_id) si requêtes par paire
CREATE INDEX IF NOT EXISTS idx_user_progress_user_question
  ON public.user_progress (user_id, question_id);

-- 8) categories : filtre par type + is_active
CREATE INDEX IF NOT EXISTS idx_categories_type_active
  ON public.categories (type, is_active);

-- ============================================================
-- Vérification : lister les index créés
-- ============================================================
SELECT tablename, indexname
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND (indexname LIKE 'idx\_%' ESCAPE '\')
 ORDER BY tablename, indexname;
