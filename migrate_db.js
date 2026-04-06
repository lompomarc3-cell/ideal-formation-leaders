const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabase = createClient(
  'https://cyasoaihjjochwhnhwqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'
)

// Tables réelles dans Supabase (différentes du code)
// questions: id, category_id, enonce, option_a/b/c/d, reponse_correcte, explication, matiere, difficulte, is_demo, is_active
// categories: id, ?, ...  (let's check)
// users: vide
// user_progress: id, user_id, categorie_id(?)

async function main() {
  console.log('🔍 Analyse complète de la structure réelle...\n')

  // 1. Voir la structure réelle des categories
  const { data: cats, error: ce } = await supabase.from('categories').select('*').limit(5)
  console.log('categories (erreur?):', ce?.message)
  console.log('categories data:', JSON.stringify(cats?.slice(0,2), null, 2))

  // 2. Voir la structure user_progress
  const { data: prog } = await supabase.from('user_progress').select('*').limit(2)
  console.log('\nuser_progress:', JSON.stringify(prog))

  // 3. Compter les questions
  const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true })
  console.log('\nTotal questions:', qCount)
  
  // Voir categories directement
  const { data: cats2 } = await supabase.from('categories').select('*')
  console.log('\ncategories (sans filtre):', cats2 ? `${cats2.length} rows` : 'null')
  if (cats2 && cats2.length > 0) {
    console.log('Sample category:', JSON.stringify(cats2[0], null, 2))
  }
  
  // Toutes tables possibles
  const allTables = ['users', 'categories', 'questions', 'user_progress', 'payment_requests', 
    'prix_config', 'ifl_users', 'ifl_categories', 'ifl_questions', 'ifl_user_progress',
    'ifl_payment_requests', 'ifl_prix_config', 'subscriptions', 'payments']
  
  console.log('\n📊 État de toutes les tables:')
  for (const t of allTables) {
    const { data, error, count } = await supabase.from(t).select('*', { count: 'exact', head: true })
    if (!error) console.log(`  ✅ ${t}: ${count} rows`)
  }
}

main().catch(console.error)
