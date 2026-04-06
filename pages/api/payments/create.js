export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  const { type_concours, numero_paiement, capture_url } = req.body
  
  if (!type_concours) {
    return res.status(400).json({ error: 'type_concours requis' })
  }

  const montant = type_concours === 'direct' ? 5000 : 20000

  try {
    // Stocker dans correction_requests
    const { data, error } = await supabaseAdmin
      .from('correction_requests')
      .insert({
        user_id: decoded.userId,
        question_id: null,
        message: JSON.stringify({
          type: 'ifl_payment',
          montant,
          type_concours,
          capture_url: capture_url || null,
          numero_paiement: numero_paiement || null
        }),
        status: 'pending',
        admin_response: null
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Erreur création demande: ' + error.message })
    }

    return res.status(201).json({
      success: true,
      payment_id: data.id,
      message: `Demande de paiement créée. Montant: ${montant} FCFA pour concours ${type_concours}. Un admin validera sous 24h.`
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
