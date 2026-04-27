-- ================================================================
-- SCRIPT FINAL DE SÉCURITÉ + INDEXES — IFL Application
-- À EXÉCUTER UNE SEULE FOIS dans le SQL Editor Supabase :
-- https://app.supabase.com/project/cyasoaihjjochwhnhwqf/sql/new
--
-- Ce script est IDEMPOTENT (peut être ré-exécuté sans risque)
-- Schéma réel : profiles, categories, questions, user_progress,
--               correction_requests, bookmarks, otp_codes
-- ================================================================

-- ============================================================
-- 1. ACTIVATION RLS (Row Level Security)
-- ============================================================
ALTER TABLE IF EXISTS profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS correction_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookmarks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS otp_codes            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. POLITIQUES RLS — données personnelles protégées
-- ============================================================
-- Suppression des anciennes policies (si elles existent)
DROP POLICY IF EXISTS "profiles_select_own"             ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"             ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"             ON profiles;
DROP POLICY IF EXISTS "correction_requests_select_own"  ON correction_requests;
DROP POLICY IF EXISTS "correction_requests_insert_own"  ON correction_requests;
DROP POLICY IF EXISTS "user_progress_select_own"        ON user_progress;
DROP POLICY IF EXISTS "user_progress_insert_own"        ON user_progress;
DROP POLICY IF EXISTS "bookmarks_select_own"            ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_own"            ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete_own"            ON bookmarks;

-- Profiles : uniquement son propre profil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- correction_requests : uniquement ses propres enregistrements
CREATE POLICY "correction_requests_select_own" ON correction_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "correction_requests_insert_own" ON correction_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_progress : uniquement sa propre progression
CREATE POLICY "user_progress_select_own" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_progress_insert_own" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- bookmarks : uniquement ses propres favoris
CREATE POLICY "bookmarks_select_own" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_own" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete_own" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. INDEXES D'OPTIMISATION (performance 20+ utilisateurs)
-- ============================================================
-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_category_active
  ON questions(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_questions_is_demo
  ON questions(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_questions_created_at
  ON questions(created_at ASC);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_phone
  ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription
  ON profiles(subscription_status, subscription_type);

-- correction_requests
CREATE INDEX IF NOT EXISTS idx_correction_requests_user_id
  ON correction_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_correction_requests_status
  ON correction_requests(status);
CREATE INDEX IF NOT EXISTS idx_correction_requests_user_status
  ON correction_requests(user_id, status);

-- user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id
  ON user_progress(user_id);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_type_active
  ON categories(type, is_active);

-- ============================================================
-- 4. SYNCHRONISATION question_count
-- ============================================================
UPDATE categories c
SET question_count = (
  SELECT COUNT(*) FROM questions q
  WHERE q.category_id = c.id AND q.is_active = true
);

-- ============================================================
-- 5. VÉRIFICATION FINALE
-- ============================================================
SELECT
  t.tablename,
  t.rowsecurity AS rls_active,
  COUNT(p.policyname) AS policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN ('profiles','correction_requests','user_progress','bookmarks','otp_codes','questions','categories')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
