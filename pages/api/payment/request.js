import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Connexion requise' })

  const decoded = verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  const { montant, type_concours, capture_url, numero_paiement } = req.body
  if (!montant || !type_concours) return res.status(400).json({ error: 'Paramètres manquants' })

  try {
    // Vérifier qu'une demande identique n'est pas déjà en attente
    const { data: existing } = await supabaseAdmin
      .from('correction_requests')
      .select('id')
      .eq('user_id', decoded.userId)
      .eq('status', 'pending')
      .like('message', `%"type":"payment"%"type_concours":"${type_concours}"%`)
      .maybeSingle()

    if (existing) {
      return res.status(400).json({ error: 'Une demande de paiement est déjà en cours pour ce type de concours.' })
    }

    const { data, error } = await supabaseAdmin.from('correction_requests').insert({
      user_id: decoded.userId,
      question_id: null,
      message: JSON.stringify({
        type: 'payment',
        montant,
        type_concours,
        capture_url: capture_url || null,
        numero_paiement: numero_paiement || null,
        timestamp: new Date().toISOString()
      }),
      status: 'pending',
      admin_response: null
    }).select().single()

    if (error) throw error

    return res.status(201).json({ success: true, payment_id: data.id })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
