const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cyasoaihjjochwhnhwqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'
)

async function check() {
  // Tables confirmées qui marchent
  const working = ['categories', 'questions', 'user_progress', 'profiles', 'users', 'correction_requests', 'payment_requests']
  
  for (const t of working) {
    const { data, error, count } = await supabase.from(t).select('*').limit(1)
    if (error) {
      console.log(`❌ ${t}: ${error.message.substring(0,60)}`)
    } else {
      const cols = data && data.length > 0 ? Object.keys(data[0]).join(', ') : '(vide)'
      console.log(`✅ ${t}: ${cols}`)
    }
  }
}

check()
