const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cyasoaihjjochwhnhwqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'
)

async function main() {
  console.log('=== INSPECTION COMPLÈTE DE LA BASE DE DONNÉES ===\n')
  
  // 1. Vérifier la structure de profiles
  console.log('📋 1. Structure de la table profiles:')
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  
  if (!profilesErr && profiles && profiles[0]) {
    console.log('   Colonnes:', Object.keys(profiles[0]))
  } else {
    console.log('   Erreur ou vide:', profilesErr?.message || 'Aucune donnée')
  }

  // 2. Vérifier la structure de categories
  console.log('\n📁 2. Structure de la table categories:')
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .limit(1)
  
  if (!catErr && categories && categories[0]) {
    console.log('   Colonnes:', Object.keys(categories[0]))
  } else {
    console.log('   Erreur ou vide:', catErr?.message || 'Aucune donnée')
  }

  // 3. Vérifier les catégories professionnelles
  console.log('\n📚 3. Catégories professionnelles existantes:')
  const { data: catProf, error: catProfErr } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'professionnel')
    .order('id')
  
  if (!catProfErr && catProf) {
    console.log(`   Total: ${catProf.length} catégories`)
    catProf.forEach((cat, i) => {
      console.log(`   ${i+1}. ${cat.nom} (ID: ${cat.id.substring(0,8)}...)`)
    })
  } else {
    console.log('   Erreur:', catProfErr?.message)
  }

  // 4. Vérifier les questions
  console.log('\n❓ 4. Questions totales:')
  const { count: qCount, error: qErr } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
  
  if (!qErr) {
    console.log(`   Total: ${qCount} questions`)
  }

  // 5. Chercher la question sur les régions
  console.log('\n🔍 5. Recherche question régions Burkina:')
  const { data: regionQ, error: regionErr } = await supabase
    .from('questions')
    .select('*')
    .ilike('enonce', '%régions%')
  
  if (!regionErr && regionQ) {
    console.log(`   Trouvée: ${regionQ.length} question(s)`)
    regionQ.forEach(q => {
      console.log(`   Q: "${q.enonce.substring(0, 80)}..."`)
      console.log(`   Réponse correcte: ${q.reponse_correcte}`)
    })
  }

  // 6. Vérifier les utilisateurs admin
  console.log('\n👨‍💼 6. Utilisateurs admin (profiles):')
  const { data: admins, error: adminErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'superadmin')
  
  if (!adminErr && admins) {
    console.log(`   Total: ${admins.length} admin(s)`)
    admins.forEach(a => {
      console.log(`   - ${a.full_name} (${a.phone})`)
    })
  }

  // 7. Vérifier prix_config
  console.log('\n💰 7. Configuration des prix:')
  const { data: prix, error: prixErr } = await supabase
    .from('prix_config')
    .select('*')
  
  if (!prixErr && prix) {
    prix.forEach(p => {
      console.log(`   ${p.type_concours}: ${p.prix} FCFA`)
    })
  } else {
    console.log('   Table prix_config non trouvée ou vide')
  }

  console.log('\n✅ Inspection terminée!\n')
}

main().catch(console.error)
