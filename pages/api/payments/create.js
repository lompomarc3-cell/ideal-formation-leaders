export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Connexion requise' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  const { type_concours, numero_paiement } = req.body

  if (!type_concours || !['direct', 'professionnel'].includes(type_concours)) {
    return res.status(400).json({ error: 'Type de concours invalide' })
  }

  const montant = type_concours === 'direct' ? 5000 : 20000

  try {
    const { data: payment, error } = await supabaseAdmin
      .from('ifl_payment_requests')
      .insert({
        user_id: decoded.userId,
        montant,
        type_concours,
        numero_paiement: numero_paiement || null,
        valide: false,
        date_demande: new Date().toISOString()
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json({
      success: true,
      payment,
      message: 'Demande créée. Envoyez votre capture WhatsApp au +22676223962'
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
