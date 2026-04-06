import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { requestId, userId, paymentType, adminKey } = req.body

  // Simple admin key check
  if (adminKey !== 'IFL_ADMIN_2025') {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  try {
    // Update request
    await supabaseAdmin
      .from('correction_requests')
      .update({ 
        status: 'resolved',
        admin_response: 'Paiement validé - accès activé'
      })
      .eq('id', requestId)

    // Activate user subscription
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_type: paymentType,
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({ success: true, profile: data })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
