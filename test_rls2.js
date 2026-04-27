const { createClient } = require('@supabase/supabase-js');
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44';
const sb = createClient('https://cyasoaihjjochwhnhwqf.supabase.co', ANON_KEY);

(async () => {
  // Tentative UPDATE avec returning
  const { data, error, count } = await sb.from('profiles')
    .update({ full_name: 'HACKED' }, { count: 'exact' })
    .eq('phone', '+22612121213')
    .select();
  console.log('UPDATE result :', { data, error, count });

  // Attempt DELETE with returning
  const { data: dData, error: dErr, count: dCount } = await sb.from('profiles')
    .delete({ count: 'exact' })
    .eq('phone', '+22612121213')
    .select();
  console.log('DELETE result :', { dData, dErr, dCount });

  // Check Ali still untouched
  const { data: ali } = await sb.from('profiles').select('full_name, role').eq('phone', '+22612121213').maybeSingle();
  console.log('Ali après attaque :', ali);
})();
