export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  const { type_concours, montant, numero_paiement, capture_url } = req.body

  if (!type_concours || !montant) {
    return res.status(400).json({ error: 'Type de concours et montant requis' })
  }

  const expectedAmount = type_concours === 'direct' ? 5000 : 20000

  try {
    const { data, error } = await supabaseAdmin
      .from('ifl_payment_requests')
      .insert({
        user_id: decoded.userId,
        montant: expectedAmount,
        type_concours,
        capture_url: capture_url || null,
        numero_paiement: numero_paiement || null,
        valide: false,
        date_demande: new Date().toISOString()
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json({
      success: true,
      message: 'Demande de paiement envoyée ! L\'admin validera votre abonnement sous 24h.',
      payment: data
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
