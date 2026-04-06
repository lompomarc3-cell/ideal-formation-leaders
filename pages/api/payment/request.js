import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Connexion requise' })

  const decoded = verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  const { type_concours, montant, numero_paiement, notes } = req.body

  if (!type_concours || !montant) {
    return res.status(400).json({ error: 'Type et montant requis' })
  }

  const validMontants = { direct: 5000, professionnel: 20000 }
  if (montant !== validMontants[type_concours]) {
    return res.status(400).json({ error: 'Montant incorrect pour ce type d\'abonnement' })
  }

  try {
    // Vérifier s'il y a déjà une demande en attente
    const { data: existing } = await supabaseAdmin
      .from('correction_requests')
      .select('id, status')
      .eq('user_id', decoded.userId)
      .like('message', '%"type":"payment"%')
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return res.status(400).json({ error: 'Vous avez déjà une demande de paiement en attente. Attendez la validation de l\'admin.' })
    }

    const { data, error } = await supabaseAdmin
      .from('correction_requests')
      .insert({
        user_id: decoded.userId,
        question_id: null,
        message: JSON.stringify({
          type: 'payment',
          type_concours,
          montant,
          numero_paiement: numero_paiement || '',
          notes: notes || ''
        }),
        status: 'pending',
        admin_response: null
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json({
      success: true,
      message: '✅ Demande envoyée ! L\'admin validera votre paiement sous peu.',
      payment_id: data.id
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message })
  }
}
