import { supabaseAdmin } from '../../lib/supabase'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Sécurité - token secret
  const { secret } = req.body
  if (secret !== 'IFL_INIT_2025') {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  const results = []
  
  try {
    // 1. Créer table ifl_users
    const { error: e1 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS ifl_users (
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
      )`
    })
    results.push({ table: 'ifl_users', error: e1?.message || null })
  } catch(e) {
    results.push({ table: 'ifl_users', error: e.message })
  }

  // Méthode alternative: essayer d'insérer l'admin directement
  try {
    const password_hash = await bcrypt.hash('IFL@Admin2025!', 12)
    
    // Essayer de créer la table via insert (échouera si pas de table)
    const { data, error } = await supabaseAdmin
      .from('ifl_users')
      .upsert({
        phone: '+22676223962',
        nom: 'NIAMPA',
        prenom: 'Issa',
        password_hash,
        role: 'admin',
        is_admin: true
      }, { onConflict: 'phone' })
      .select()
    
    results.push({ action: 'admin_user', data: data ? 'created/updated' : null, error: error?.message || null })
  } catch(e) {
    results.push({ action: 'admin_user', error: e.message })
  }

  return res.json({ success: true, results })
}
