import { supabaseAdmin } from '../../lib/supabase'
import { hashPassword } from '../../lib/auth'
import https from 'https'

// Endpoint spécial pour initialiser la base de données
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { secret } = req.body
  if (secret !== 'IFL_INIT_DB_2025') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  const results = {}
  
  // Vérifier les tables existantes
  const tables = ['users', 'payment_requests', 'categories', 'questions', 'user_progress']
  for (const t of tables) {
    const { error } = await supabaseAdmin.from(t).select('*', { count: 'exact', head: true })
    results[t] = error ? '❌ MISSING' : '✅ EXISTS'
  }

  // Essayer de créer l'admin si la table users existe
  const { error: usersErr } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true })
  
  if (!usersErr) {
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id, phone')
      .eq('phone', '+22676223962')
      .maybeSingle()

    if (!existingAdmin) {
      const passwordHash = await hashPassword('IFL@Admin2025!')
      const { data: newAdmin, error: ae } = await supabaseAdmin
        .from('users')
        .insert({
          phone: '+22676223962',
          nom: 'NIAMPA',
          prenom: 'Issa',
          password_hash: passwordHash,
          role: 'admin',
          is_admin: true,
          is_active: true
        })
        .select()
        .single()
      results.admin_creation = ae ? `Error: ${ae.message}` : `Created: ${newAdmin?.phone}`
    } else {
      // Mettre à jour le mot de passe de l'admin existant
      const passwordHash = await hashPassword('IFL@Admin2025!')
      const { error: ue } = await supabaseAdmin
        .from('users')
        .update({ password_hash: passwordHash, is_admin: true, is_active: true, role: 'admin' })
        .eq('phone', '+22676223962')
      results.admin_creation = ue ? `Update Error: ${ue.message}` : `Updated: ${existingAdmin.phone}`
    }
  }

  // SQL à exécuter dans Supabase si tables manquantes
  const sqlToRun = `
-- EXÉCUTER CE SQL DANS SUPABASE SQL EDITOR:
-- https://app.supabase.com/project/cyasoaihjjochwhnhwqf/sql

CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  abonnement_type TEXT NULL,
  abonnement_valide_jusqua TIMESTAMPTZ NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  montant INT NOT NULL,
  type_concours TEXT NOT NULL,
  capture_url TEXT NULL,
  numero_paiement TEXT NULL,
  valide BOOLEAN DEFAULT FALSE,
  date_demande TIMESTAMPTZ DEFAULT NOW(),
  date_validation TIMESTAMPTZ NULL,
  notes_admin TEXT NULL
);

ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS last_question_id UUID;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS total_answered INT DEFAULT 0;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
  `

  return res.json({ 
    success: true, 
    results,
    sql_to_run: sqlToRun,
    note: 'Si des tables sont manquantes, exécutez le SQL ci-dessus dans Supabase SQL Editor'
  })
}
