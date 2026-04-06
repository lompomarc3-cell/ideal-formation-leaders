const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA';

const supabase = createClient(supabaseUrl, serviceKey);

async function setupDatabase() {
  console.log('Setting up IFL database...');
  
  // Test connection
  const { data: test, error: testErr } = await supabase.from('categories').select('count').limit(1);
  if (testErr) {
    console.log('Connection test:', testErr.message);
  } else {
    console.log('Connection OK');
  }
  
  // Try to create table via RPC
  const queries = [
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
  ];
  
  for (const q of queries) {
    const { data, error } = await supabase.rpc('exec_sql', { sql: q });
    if (error) {
      console.log('RPC error:', error.message);
    } else {
      console.log('Query OK:', data);
    }
  }
}

setupDatabase().catch(console.error);
