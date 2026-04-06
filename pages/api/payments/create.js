import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, montant, typeAbonnement, description } = req.body

  if (!userId || !montant || !typeAbonnement) {
    return res.status(400).json({ error: 'Données manquantes' })
  }

  try {
    // Create payment request using correction_requests table
    // Format: PAIEMENT_typeAbonnement_montantFCFA
    const message = `PAIEMENT_${typeAbonnement}_${montant}FCFA${description ? ' - ' + description : ''}`

    const { data, error } = await supabaseAdmin
      .from('correction_requests')
      .insert({
        user_id: userId,
        message: message,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({ success: true, request: data })
  } catch (err) {
    console.error('Payment API error:', err)
    return res.status(500).json({ error: err.message || 'Erreur serveur' })
  }
}
