export const runtime = 'edge'
import { supabaseAdmin } from '../../lib/supabase'
import { hashPassword } from '../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { secret } = req.body
  if (secret !== 'IFL_INIT_DB_2025') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  const results = {}
  const checks = {}

  for (const table of ['ifl_users', 'ifl_payment_requests', 'ifl_prix_config', 'ifl_user_progress', 'categories', 'questions']) {
    const { error } = await supabaseAdmin.from(table).select('id', { count: 'exact', head: true }).limit(1)
    checks[table] = error ? `❌ MISSING: ${error.message}` : '✅ EXISTS'
  }
  results.tables = checks

  // Créer/mettre à jour l'admin si ifl_users existe
  if (checks['ifl_users'] === '✅ EXISTS') {
    const { data: existingAdmin } = await supabaseAdmin
      .from('ifl_users')
      .select('id, phone')
      .eq('phone', '+22676223962')
      .maybeSingle()

    const passwordHash = await hashPassword('IFL@Admin2025!')

    if (!existingAdmin) {
      const { data: newAdmin, error: ae } = await supabaseAdmin
        .from('ifl_users')
        .insert({
          phone: '+22676223962',
          nom: 'NIAMPA',
          prenom: 'Issa',
          password_hash: passwordHash,
          role: 'admin',
          is_admin: true,
          is_active: true
        })
        .select('id, phone')
        .single()

      results.admin = ae
        ? `❌ ${ae.message}`
        : `✅ Admin créé: ${newAdmin.phone}`
    } else {
      const { error: ue } = await supabaseAdmin
        .from('ifl_users')
        .update({ password_hash: passwordHash, is_admin: true, is_active: true, role: 'admin' })
        .eq('phone', '+22676223962')
      results.admin = ue
        ? `❌ ${ue.message}`
        : `✅ Admin mis à jour (${existingAdmin.phone})`
    }

    // Créer les prix si la table existe
    if (checks['ifl_prix_config'] === '✅ EXISTS') {
      for (const [type, prix, desc] of [
        ['direct', 5000, 'Concours Directs - 10 dossiers'],
        ['professionnel', 20000, 'Concours Professionnels - 12 dossiers']
      ]) {
        const { data: existing } = await supabaseAdmin
          .from('ifl_prix_config')
          .select('id')
          .eq('type_concours', type)
          .maybeSingle()

        if (!existing) {
          await supabaseAdmin.from('ifl_prix_config').insert({ type_concours: type, prix, description: desc })
          results[`price_${type}`] = `✅ Prix créé: ${prix} FCFA`
        } else {
          results[`price_${type}`] = `✅ Prix existe: ${prix} FCFA`
        }
      }
    }
  }

  const sqlToRun = `-- EXÉCUTER DANS SUPABASE SQL EDITOR:
-- https://app.supabase.com/project/cyasoaihjjochwhnhwqf/sql/new

CREATE TABLE IF NOT EXISTS public.ifl_users (
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

CREATE TABLE IF NOT EXISTS public.ifl_payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.ifl_users(id) ON DELETE CASCADE,
  montant INT NOT NULL,
  type_concours TEXT NOT NULL,
  capture_url TEXT NULL,
  numero_paiement TEXT NULL,
  valide BOOLEAN DEFAULT FALSE,
  date_demande TIMESTAMPTZ DEFAULT NOW(),
  date_validation TIMESTAMPTZ NULL,
  notes_admin TEXT NULL
);

CREATE TABLE IF NOT EXISTS public.ifl_prix_config (
  id SERIAL PRIMARY KEY,
  type_concours TEXT NOT NULL UNIQUE,
  prix INT NOT NULL,
  description TEXT NULL
);

INSERT INTO public.ifl_prix_config (type_concours, prix, description) 
VALUES ('direct', 5000, 'Concours Directs'),('professionnel', 20000, 'Concours Professionnels')
ON CONFLICT (type_concours) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ifl_user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.ifl_users(id) ON DELETE CASCADE,
  categorie_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  derniere_question_id UUID NULL,
  score INT DEFAULT 0,
  total_reponses INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, categorie_id)
);

ALTER TABLE public.ifl_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifl_payment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifl_prix_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifl_user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;`

  const needsSQL = Object.values(checks).some(v => v.startsWith('❌'))

  return res.json({
    success: true,
    results,
    sql_needed: needsSQL,
    sql_to_run: needsSQL ? sqlToRun : null,
    message: needsSQL
      ? '⚠️ Tables manquantes. Exécutez le SQL ci-dessus dans Supabase.'
      : '✅ Base de données prête !'
  })
}
