import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, phone, nom, prenom } = req.body

  if (!userId || !phone || !nom || !prenom) {
    return res.status(400).json({ error: 'Données manquantes' })
  }

  try {
    // Check if phone already exists
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .limit(1)

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Ce numéro est déjà utilisé' })
    }

    // Create profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: `${prenom} ${nom}`,
        phone: phone,
        role: 'user',
        subscription_status: 'free'
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({ success: true, profile: data })
  } catch (err) {
    console.error('Register API error:', err)
    return res.status(500).json({ error: err.message || 'Erreur serveur' })
  }
}
