export const runtime = 'edge'
import { supabaseAdmin } from '../../lib/supabase'
import { hashPassword } from '../../lib/auth'

// Cette API crée les tables manquantes et initialise les données
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  // Clé secrète pour protéger cette route
  const { secret } = req.body
  if (secret !== 'IFL_SETUP_2025') {
    return res.status(403).json({ error: 'Clé secrète incorrecte' })
  }

  const results = {}

  try {
    // Test si la table users existe
    const { data: usersTest, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true })

    if (usersErr && usersErr.message.includes('schema cache')) {
      results.users_table = 'MISSING - Need to create via Supabase SQL Editor'
    } else {
      results.users_table = 'EXISTS'
    }

    // Test payment_requests
    const { error: payErr } = await supabaseAdmin
      .from('payment_requests')
      .select('count', { count: 'exact', head: true })

    results.payment_requests_table = payErr ? 'MISSING' : 'EXISTS'

    // Vérifier l'admin
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('id, phone')
      .eq('phone', '+22676223962')
      .maybeSingle()

    if (!adminUser && !usersErr) {
      const passwordHash = await hashPassword('IFL@Admin2025!')
      const { data: newAdmin, error: adminErr } = await supabaseAdmin
        .from('users')
        .insert({
          phone: '+22676223962',
          nom: 'NIAMPA',
          prenom: 'Issa',
          password_hash: passwordHash,
          role: 'admin',
          is_admin: true,
          is_active: true
        })
        .select()
        .single()

      results.admin = adminErr ? `ERROR: ${adminErr.message}` : `CREATED: ${newAdmin?.phone}`
    } else {
      results.admin = adminUser ? `EXISTS: ${adminUser.phone}` : 'TABLE NOT READY'
    }

    // Compter les catégories
    const { count: catCount } = await supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact', head: true })
    results.categories = `${catCount} categories`

    // Compter les questions
    const { count: qCount } = await supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact', head: true })
    results.questions = `${qCount} questions`

    return res.json({ success: true, results })
  } catch (error) {
    return res.status(500).json({ error: error.message, results })
  }
}
