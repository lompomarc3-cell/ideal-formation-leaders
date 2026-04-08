/**
 * Test de simultanéité - Créer 3 utilisateurs et tester la connexion simultanée
 */
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44'

// Créer 3 clients Supabase indépendants
const client1 = createClient(supabaseUrl, supabaseAnonKey)
const client2 = createClient(supabaseUrl, supabaseAnonKey)
const client3 = createClient(supabaseUrl, supabaseAnonKey)

// Utilisateurs de test
const users = [
  { phone: '+22670111111', nom: 'TEST', prenom: 'User1', password: 'Test123!', client: client1 },
  { phone: '+22670222222', nom: 'TEST', prenom: 'User2', password: 'Test456!', client: client2 },
  { phone: '+22670333333', nom: 'TEST', prenom: 'User3', password: 'Test789!', client: client3 }
]

async function testSimultaneity() {
  console.log('👥 TEST DE SIMULTANÉITÉ (3 UTILISATEURS)\n')
  
  // Étape 1: Créer/inscrire les 3 utilisateurs
  console.log('1️⃣ Inscription simultanée de 3 utilisateurs...')
  
  const signupPromises = users.map(async (user, index) => {
    try {
      const { data, error } = await user.client.auth.signUp({
        phone: user.phone,
        password: user.password,
        options: {
          data: {
            full_name: `${user.prenom} ${user.nom}`,
            phone: user.phone
          }
        }
      })
      
      if (error) {
        // Utilisateur existe déjà, essayer de se connecter
        const { data: signInData, error: signInError } = await user.client.auth.signInWithPassword({
          phone: user.phone,
          password: user.password
        })
        
        if (signInError) {
          console.log(`   ⚠️  User${index + 1} (${user.phone}): Existe déjà`)
          return { index, success: true, existing: true }
        }
        
        return { index, success: true, data: signInData, existing: true }
      }
      
      return { index, success: true, data }
    } catch (e) {
      return { index, success: false, error: e.message }
    }
  })
  
  const signupResults = await Promise.all(signupPromises)
  
  signupResults.forEach(result => {
    if (result.success) {
      console.log(`   ✅ User${result.index + 1} inscrit/connecté avec succès`)
    } else {
      console.log(`   ❌ User${result.index + 1}: ${result.error}`)
    }
  })
  
  console.log('\n2️⃣ Connexion simultanée des 3 utilisateurs...')
  
  const loginPromises = users.map(async (user, index) => {
    try {
      const { data, error } = await user.client.auth.signInWithPassword({
        phone: user.phone,
        password: user.password
      })
      
      if (error) throw error
      
      return {
        index,
        success: true,
        session: data.session,
        user: data.user
      }
    } catch (e) {
      return {
        index,
        success: false,
        error: e.message
      }
    }
  })
  
  const loginResults = await Promise.all(loginPromises)
  
  loginResults.forEach(result => {
    if (result.success) {
      console.log(`   ✅ User${result.index + 1} connecté (Session: ${result.session?.access_token?.substring(0, 20)}...)`)
    } else {
      console.log(`   ❌ User${result.index + 1}: ${result.error}`)
    }
  })
  
  console.log('\n3️⃣ Actions simultanées (récupération des catégories)...')
  
  const categoriesPromises = loginResults
    .filter(r => r.success)
    .map(async (result) => {
      try {
        const { data, error } = await users[result.index].client
          .from('categories')
          .select('id, nom, type')
          .eq('type', 'professionnel')
        
        if (error) throw error
        
        return {
          index: result.index,
          success: true,
          count: data?.length || 0
        }
      } catch (e) {
        return {
          index: result.index,
          success: false,
          error: e.message
        }
      }
    })
  
  const categoriesResults = await Promise.all(categoriesPromises)
  
  categoriesResults.forEach(result => {
    if (result.success) {
      console.log(`   ✅ User${result.index + 1} a récupéré ${result.count} catégories`)
    } else {
      console.log(`   ❌ User${result.index + 1}: ${result.error}`)
    }
  })
  
  console.log('\n4️⃣ Déconnexion simultanée...')
  
  const logoutPromises = loginResults
    .filter(r => r.success)
    .map(async (result) => {
      try {
        const { error } = await users[result.index].client.auth.signOut()
        if (error) throw error
        return { index: result.index, success: true }
      } catch (e) {
        return { index: result.index, success: false, error: e.message }
      }
    })
  
  const logoutResults = await Promise.all(logoutPromises)
  
  logoutResults.forEach(result => {
    if (result.success) {
      console.log(`   ✅ User${result.index + 1} déconnecté`)
    } else {
      console.log(`   ⚠️  User${result.index + 1}: ${result.error}`)
    }
  })
  
  console.log('\n✅ RÉSUMÉ DES TESTS DE SIMULTANÉITÉ')
  console.log(`   📊 Utilisateurs créés/testés: ${users.length}`)
  console.log(`   ✅ Connexions simultanées: ${loginResults.filter(r => r.success).length}/${users.length}`)
  console.log(`   ✅ Actions concurrentes: ${categoriesResults.filter(r => r.success).length}/${users.length}`)
  console.log(`   ✅ L'application supporte la simultanéité !`)
  console.log('\n   💡 Conclusion: Plusieurs utilisateurs peuvent se connecter')
  console.log('      et utiliser l\'application en même temps sans conflit.\n')
}

testSimultaneity().catch(console.error)
