import { supabaseAdmin } from '../../lib/supabase'
import bcrypt from 'bcryptjs'

// Migration SQL statements
const MIGRATION_SQL = [
  `CREATE TABLE IF NOT EXISTS ifl_users (
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
  )`,
  `CREATE TABLE IF NOT EXISTS ifl_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom TEXT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    type_concours TEXT NOT NULL,
    parent_id UUID NULL,
    icone TEXT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS ifl_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    categorie_id UUID NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    bonne_reponse CHAR(1) NOT NULL,
    explication TEXT NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS ifl_user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    categorie_id UUID NOT NULL,
    derniere_question_id UUID NULL,
    score INT DEFAULT 0,
    total_repondu INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, categorie_id)
  )`,
  `CREATE TABLE IF NOT EXISTS ifl_payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    montant INT NOT NULL,
    type_concours TEXT NOT NULL,
    capture_url TEXT NULL,
    numero_paiement TEXT NULL,
    valide BOOLEAN DEFAULT FALSE,
    date_demande TIMESTAMPTZ DEFAULT NOW(),
    date_validation TIMESTAMPTZ NULL,
    notes_admin TEXT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ifl_prix_config (
    id SERIAL PRIMARY KEY,
    type_concours TEXT NOT NULL UNIQUE,
    prix INT NOT NULL,
    description TEXT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ifl_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { secret } = req.body
  if (secret !== 'IFL_SETUP_2025_SECURE') {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  const results = []

  // Essayer de créer les tables via RPC si disponible
  for (const sql of MIGRATION_SQL) {
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql })
      if (error) {
        results.push({ sql: sql.substring(0, 50), status: 'rpc_error', msg: error.message })
      } else {
        results.push({ sql: sql.substring(0, 50), status: 'ok' })
      }
    } catch (e) {
      results.push({ sql: sql.substring(0, 50), status: 'exception', msg: e.message })
    }
  }

  // Vérifier si ifl_users existe et créer l'admin
  try {
    const hash = await bcrypt.hash('IFL@Admin2025!', 12)
    const { data, error } = await supabaseAdmin
      .from('ifl_users')
      .upsert({
        phone: '+22676223962',
        nom: 'NIAMPA',
        prenom: 'Issa',
        password_hash: hash,
        role: 'admin',
        is_admin: true,
        is_active: true
      }, { onConflict: 'phone' })
      .select()
      .single()

    if (error) {
      results.push({ action: 'create_admin', status: 'error', msg: error.message })
    } else {
      results.push({ action: 'create_admin', status: 'ok', userId: data?.id })
    }
  } catch (e) {
    results.push({ action: 'create_admin', status: 'exception', msg: e.message })
  }

  // Insérer les catégories
  try {
    const categoriesDirect = [
      { nom: 'Actualité / Culture générale', ordre: 1, type_concours: 'direct', icone: '🌍', is_active: true },
      { nom: 'Français', ordre: 2, type_concours: 'direct', icone: '📚', is_active: true },
      { nom: 'Littérature et art', ordre: 3, type_concours: 'direct', icone: '🎨', is_active: true },
      { nom: 'Histoire-Géographie', ordre: 4, type_concours: 'direct', icone: '🗺️', is_active: true },
      { nom: 'SVT', ordre: 5, type_concours: 'direct', icone: '🧬', is_active: true },
      { nom: 'Psychotechniques', ordre: 6, type_concours: 'direct', icone: '🧠', is_active: true },
      { nom: 'Maths', ordre: 7, type_concours: 'direct', icone: '📐', is_active: true },
      { nom: 'Physique-Chimie', ordre: 8, type_concours: 'direct', icone: '⚗️', is_active: true },
      { nom: 'Entraînement QCM', ordre: 9, type_concours: 'direct', icone: '✏️', is_active: true },
      { nom: 'Accompagnement final', ordre: 10, type_concours: 'direct', icone: '🎯', is_active: true },
    ]
    
    const categoriesPro = [
      { nom: 'Spécialités Vie scolaire (CASU/AASU)', ordre: 1, type_concours: 'professionnel', icone: '🏫', is_active: true },
      { nom: 'Spécialités CISU/AISU/ENAREF', ordre: 2, type_concours: 'professionnel', icone: '🏛️', is_active: true },
      { nom: 'Inspectorat (IES/IEPENF)', ordre: 3, type_concours: 'professionnel', icone: '🔍', is_active: true },
      { nom: 'Agrégés', ordre: 4, type_concours: 'professionnel', icone: '🎓', is_active: true },
      { nom: 'CAPES toutes options', ordre: 5, type_concours: 'professionnel', icone: '📖', is_active: true },
      { nom: 'Administrateur des hôpitaux', ordre: 6, type_concours: 'professionnel', icone: '🏥', is_active: true },
      { nom: 'Spécialités santé', ordre: 7, type_concours: 'professionnel', icone: '💊', is_active: true },
      { nom: 'Spécialités GSP', ordre: 8, type_concours: 'professionnel', icone: '🛡️', is_active: true },
      { nom: 'Spécialités police', ordre: 9, type_concours: 'professionnel', icone: '👮', is_active: true },
      { nom: 'Administrateur civil', ordre: 10, type_concours: 'professionnel', icone: '📋', is_active: true },
      { nom: 'Entraînement QCM', ordre: 11, type_concours: 'professionnel', icone: '✏️', is_active: true },
      { nom: 'Accompagnement final', ordre: 12, type_concours: 'professionnel', icone: '🎯', is_active: true },
    ]

    const { count: existingCats } = await supabaseAdmin
      .from('ifl_categories')
      .select('*', { count: 'exact', head: true })

    if (!existingCats || existingCats === 0) {
      const { error } = await supabaseAdmin
        .from('ifl_categories')
        .insert([...categoriesDirect, ...categoriesPro])
      results.push({ action: 'categories', status: error ? 'error' : 'ok', msg: error?.message })
    } else {
      results.push({ action: 'categories', status: 'already_exist', count: existingCats })
    }
  } catch (e) {
    results.push({ action: 'categories', status: 'exception', msg: e.message })
  }

  // Configurer les prix
  try {
    await supabaseAdmin.from('ifl_prix_config').upsert([
      { type_concours: 'direct', prix: 5000, description: 'Concours Directs - 10 dossiers' },
      { type_concours: 'professionnel', prix: 20000, description: 'Concours Professionnels - 12 dossiers' }
    ], { onConflict: 'type_concours' })
    results.push({ action: 'prices', status: 'ok' })
  } catch (e) {
    results.push({ action: 'prices', status: 'exception', msg: e.message })
  }

  return res.json({ success: true, results })
}
