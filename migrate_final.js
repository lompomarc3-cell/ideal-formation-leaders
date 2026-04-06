const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabase = createClient(
  'https://cyasoaihjjochwhnhwqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'
)

async function checkAndCreateUsers() {
  // Vérifier si ifl_users existe en essayant d'insérer quelque chose
  const { data, error } = await supabase.from('ifl_users').select('count', { count: 'exact', head: true })
  if (error && error.code === '42P01') {
    return false // table n'existe pas
  }
  return true
}

async function initAdmin() {
  console.log('=== INITIALISATION BASE DE DONNÉES IFL ===\n')
  
  // 1. Vérifier si ifl_users existe
  const usersExists = await checkAndCreateUsers()
  
  if (!usersExists) {
    console.log('❌ Table ifl_users manquante!')
    console.log('📋 VEUILLEZ EXÉCUTER LE SQL SUIVANT DANS SUPABASE:')
    console.log('🔗 https://app.supabase.com/project/cyasoaihjjochwhnhwqf/editor\n')
    
    const sql = `
-- ============================================
-- SCRIPT SQL COMPLET IFL - EXÉCUTER EN UNE FOIS
-- ============================================

-- TABLE UTILISATEURS
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

-- TABLE DEMANDES DE PAIEMENT
CREATE TABLE IF NOT EXISTS ifl_payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES ifl_users(id) ON DELETE CASCADE,
  montant INT NOT NULL,
  type_concours TEXT NOT NULL DEFAULT 'direct',
  capture_url TEXT NULL,
  numero_paiement TEXT NULL,
  valide BOOLEAN DEFAULT FALSE,
  notes_admin TEXT NULL,
  date_demande TIMESTAMPTZ DEFAULT NOW(),
  date_validation TIMESTAMPTZ NULL
);

-- TABLE CONFIGURATION DES PRIX
CREATE TABLE IF NOT EXISTS prix_config (
  id SERIAL PRIMARY KEY,
  type_concours TEXT NOT NULL UNIQUE,
  prix INT NOT NULL
);

-- DÉSACTIVER RLS
ALTER TABLE ifl_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE ifl_payment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE prix_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;

-- INSÉRER LES PRIX DE BASE
INSERT INTO prix_config (type_concours, prix) VALUES ('direct', 5000), ('professionnel', 20000)
ON CONFLICT (type_concours) DO NOTHING;

-- CRÉER LE COMPTE ADMIN
-- Note: Remplacer HASH_TO_REPLACE par le hash bcrypt généré
INSERT INTO ifl_users (phone, nom, prenom, password_hash, role, is_admin, is_active)
VALUES ('+22676223962', 'NIAMPA', 'Issa', '${await bcrypt.hash('IFL@Admin2025!', 10)}', 'admin', true, true)
ON CONFLICT (phone) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  is_admin = true,
  role = 'admin';
`
    console.log(sql)
    process.exit(1)
  }
  
  console.log('✅ Table ifl_users existe')
  
  // 2. Créer/mettre à jour l'admin
  console.log('\n👤 Création du compte admin...')
  const passwordHash = await bcrypt.hash('IFL@Admin2025!', 10)
  
  const { data: admin, error: adminErr } = await supabase
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
    .select('phone, nom, prenom, is_admin')
    .single()
  
  if (adminErr) {
    console.error('❌ Erreur admin:', adminErr.message)
  } else {
    console.log('✅ Admin créé/mis à jour:', JSON.stringify(admin))
  }
  
  // 3. Vérifier prix_config
  console.log('\n💰 Vérification des prix...')
  const { data: prices } = await supabase.from('prix_config').select('*')
  if (!prices || prices.length === 0) {
    await supabase.from('prix_config').insert([
      { type_concours: 'direct', prix: 5000 },
      { type_concours: 'professionnel', prix: 20000 }
    ])
    console.log('✅ Prix insérés')
  } else {
    console.log('✅ Prix déjà configurés:', prices)
  }
  
  // 4. Vérifier les catégories existantes
  console.log('\n📁 Vérification des catégories...')
  const { data: cats, count: catCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact' })
  
  console.log(`✅ ${catCount} catégories dans la table 'categories'`)
  if (cats && cats.length > 0) {
    cats.slice(0, 3).forEach(c => console.log(`   - ${c.nom} (${c.type})`))
  }
  
  // 5. Vérifier les questions existantes
  const { count: qCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n❓ ${qCount} questions dans la table 'questions'`)
  
  console.log('\n🎉 Initialisation terminée!')
  console.log('📱 Admin: +22676223962 / IFL@Admin2025!')
}

initAdmin().catch(console.error)
