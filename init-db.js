const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

const supabase = createClient(supabaseUrl, serviceKey)

async function init() {
  console.log('🚀 Initialisation de la base de données IFL...\n')

  // 1. Vérifier/créer l'admin
  console.log('👤 Création du compte admin...')
  const passwordHash = await bcrypt.hash('IFL@Admin2025!', 12)
  
  const { data: adminUser, error: adminError } = await supabase
    .from('ifl_users')
    .upsert({
      phone: '+22676223962',
      nom: 'NIAMPA',
      prenom: 'Issa',
      password_hash: passwordHash,
      role: 'admin',
      is_admin: true,
      is_active: true
    }, { onConflict: 'phone' })
    .select()
    .single()

  if (adminError) {
    console.error('❌ Erreur admin:', adminError.message)
    console.log('📌 Les tables ifl_users n\'existent pas encore.')
    console.log('📌 Veuillez exécuter le SQL suivant dans Supabase SQL Editor:')
    console.log('   https://app.supabase.com/project/cyasoaihjjochwhnhwqf/sql')
    console.log('\n' + '='.repeat(60))
    printSQL()
    return
  }
  
  console.log('✅ Admin créé/mis à jour:', adminUser.phone)

  // 2. Vérifier les catégories
  const { data: cats, error: catError } = await supabase
    .from('ifl_categories')
    .select('count')
  
  if (catError) {
    console.error('❌ Erreur catégories:', catError.message)
    return
  }

  const { count } = await supabase
    .from('ifl_categories')
    .select('*', { count: 'exact', head: true })
  
  if (count === 0) {
    console.log('📁 Insertion des catégories...')
    
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

    const { error: insertError } = await supabase
      .from('ifl_categories')
      .insert([...categoriesDirect, ...categoriesPro])
    
    if (insertError) console.error('❌ Erreur catégories:', insertError.message)
    else console.log('✅ 22 catégories insérées')
  } else {
    console.log(`✅ ${count} catégories déjà présentes`)
  }

  // 3. Vérifier les prix
  const { count: priceCount } = await supabase
    .from('ifl_prix_config')
    .select('*', { count: 'exact', head: true })
  
  if (priceCount === 0) {
    await supabase.from('ifl_prix_config').insert([
      { type_concours: 'direct', prix: 5000, description: 'Concours Directs - 10 dossiers' },
      { type_concours: 'professionnel', prix: 20000, description: 'Concours Professionnels - 12 dossiers' }
    ])
    console.log('✅ Prix configurés')
  }

  console.log('\n✅ Base de données initialisée avec succès!')
  console.log('📱 Admin: +22676223962 / IFL@Admin2025!')
}

function printSQL() {
  console.log(`
-- EXÉCUTER CE SQL DANS SUPABASE SQL EDITOR:
-- https://app.supabase.com/project/cyasoaihjjochwhnhwqf/sql

CREATE TABLE IF NOT EXISTS ifl_users (
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

CREATE TABLE IF NOT EXISTS ifl_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  ordre INT NOT NULL DEFAULT 0,
  type_concours TEXT NOT NULL,
  parent_id UUID NULL REFERENCES ifl_categories(id) ON DELETE CASCADE,
  icone TEXT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ifl_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categorie_id UUID NULL REFERENCES ifl_categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  bonne_reponse CHAR(1) NOT NULL CHECK (bonne_reponse IN ('A','B','C','D')),
  explication TEXT NOT NULL,
  is_demo BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ifl_user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES ifl_users(id) ON DELETE CASCADE,
  categorie_id UUID NOT NULL REFERENCES ifl_categories(id) ON DELETE CASCADE,
  derniere_question_id UUID NULL REFERENCES ifl_questions(id),
  score INT DEFAULT 0,
  total_repondu INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, categorie_id)
);

CREATE TABLE IF NOT EXISTS ifl_payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES ifl_users(id) ON DELETE CASCADE,
  montant INT NOT NULL,
  type_concours TEXT NOT NULL,
  capture_url TEXT NULL,
  numero_paiement TEXT NULL,
  valide BOOLEAN DEFAULT FALSE,
  date_demande TIMESTAMPTZ DEFAULT NOW(),
  date_validation TIMESTAMPTZ NULL,
  notes_admin TEXT NULL
);

CREATE TABLE IF NOT EXISTS ifl_prix_config (
  id SERIAL PRIMARY KEY,
  type_concours TEXT NOT NULL UNIQUE,
  prix INT NOT NULL,
  description TEXT NULL
);

CREATE TABLE IF NOT EXISTS ifl_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES ifl_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Désactiver RLS pour ces tables
ALTER TABLE ifl_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE ifl_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE ifl_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ifl_user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE ifl_payment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE ifl_prix_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE ifl_sessions DISABLE ROW LEVEL SECURITY;
  `)
}

init().catch(console.error)
