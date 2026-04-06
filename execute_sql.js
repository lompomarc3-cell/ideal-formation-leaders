const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabase = createClient(
  'https://cyasoaihjjochwhnhwqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'
)

async function main() {
  console.log('=== VÉRIFICATION DES TABLES EXISTANTES ===')
  
  // Test tables existantes
  const tables = ['users', 'categories', 'questions', 'user_progress', 'payment_requests', 'prix_config', 'profiles', 'correction_requests']
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*', { count: 'exact', head: true })
    console.log(`Table ${t}: ${error ? '❌ ' + error.message.substring(0,50) : '✅ EXISTS'}`)
  }
}

main().catch(console.error)
