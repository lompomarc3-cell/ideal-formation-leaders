export const runtime = 'experimental-edge'
// API: POST /api/admin/init-sessions
// Crée les tables special_sessions et user_special_sessions dans Supabase
// Réservé à l'admin – utilisé une seule fois pour l'initialisation

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

async function verifyAdmin(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const sb = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data?.user) return null
  const { data: profile } = await sb.from('profiles').select('role').eq('id', data.user.id).single()
  if (!profile || profile.role !== 'superadmin') return null
  return data.user
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST uniquement' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }

  const admin = await verifyAdmin(req)
  if (!admin) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  // Script SQL d'initialisation des tables sessions spéciales
  const SQL_SCRIPT = `
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

-- Politiques RLS pour special_sessions
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

-- Colonnes optionnelles sur profiles pour les sessions spéciales
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_special_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_direct_expires_at TIMESTAMPTZ;
`

  // Exécuter le SQL via l'API Supabase REST (pg_execute_sql)
  const SUPABASE_MGMT_TOKEN = 'sbp_993dc7fba4d7f9993f8975171a5803af77717306'
  const PROJECT_REF = 'cyasoaihjjochwhnhwqf'

  try {
    const resp = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_MGMT_TOKEN}`
      },
      body: JSON.stringify({ query: SQL_SCRIPT })
    })

    const result = await resp.json()
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Erreur SQL', details: result }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true, message: 'Tables créées avec succès', result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
