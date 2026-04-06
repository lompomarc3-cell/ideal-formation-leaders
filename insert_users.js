const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabase = createClient(
  'https://cyasoaihjjochwhnhwqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'
)

async function main() {
  const pwHash = await bcrypt.hash('IFL@Admin2025!', 12)
  
  // Insérer admin dans la table 'users' (vraie table)
  const { data, error } = await supabase.from('users').upsert({
    phone: '+22676223962',
    nom: 'NIAMPA',
    prenom: 'Issa',
    password_hash: pwHash,
    role: 'admin',
    is_admin: true,
    is_active: true
  }, { onConflict: 'phone' }).select().single()
  
  if (error) {
    console.log('ERR users:', error.message, error.code)
    
    // Essayer avec d'autres colonnes
    const { data: d2, error: e2 } = await supabase.from('users').insert({
      phone: '+22676223962',
      password_hash: pwHash,
      is_admin: true
    }).select().single()
    console.log('Users minimal insert:', e2 ? e2.message : '✅ ' + JSON.stringify(d2))
  } else {
    console.log('✅ Admin inséré:', data?.phone)
  }
  
  // Voir les colonnes exactes de user_progress
  const { data: prog, error: pe } = await supabase.from('user_progress').select('*').limit(1)
  console.log('\nuser_progress structure:', pe ? pe.message : JSON.stringify(prog))
  
  // Essayer d'insérer dans prix_config
  const { data: px, error: pxe } = await supabase.from('prix_config').upsert([
    { type_concours: 'direct', prix: 5000, description: 'Concours Directs – 10 dossiers' },
    { type_concours: 'professionnel', prix: 20000, description: 'Concours Professionnels – 12 dossiers' }
  ], { onConflict: 'type_concours' }).select()
  console.log('\nprix_config:', pxe ? 'ERR: ' + pxe.message : '✅ ' + JSON.stringify(px))
  
  // Essayer payment_requests
  const { data: pr, error: pre } = await supabase.from('payment_requests').select('*').limit(1)
  console.log('\npayment_requests:', pre ? 'ERR: ' + pre.message : '✅ ' + JSON.stringify(pr))
}

main().catch(console.error)
