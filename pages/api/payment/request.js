import { supabaseAdmin } from '../../../lib/supabase'
import { getUserFromToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Connexion requise' })

  const { montant, type_concours, numero_paiement } = req.body

  if (!montant || !type_concours) {
    return res.status(400).json({ error: 'Montant et type de concours requis' })
  }

  // Vérifier le montant
  const { data: prix } = await supabaseAdmin
    .from('ifl_prix_config')
    .select('prix')
    .eq('type_concours', type_concours)
    .single()

  if (!prix || montant !== prix.prix) {
    return res.status(400).json({ error: 'Montant incorrect' })
  }

  try {
    // Vérifier si déjà une demande en attente
    const { data: existing } = await supabaseAdmin
      .from('ifl_payment_requests')
      .select('id, valide')
      .eq('user_id', user.id)
      .eq('type_concours', type_concours)
      .eq('valide', false)
      .maybeSingle()

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Vous avez déjà une demande en cours d\'examen. L\'admin validera votre accès sous 24h.',
        existingRequest: true
      })
    }

    const { data, error } = await supabaseAdmin
      .from('ifl_payment_requests')
      .insert({
        user_id: user.id,
        montant,
        type_concours,
        numero_paiement: numero_paiement || user.phone,
        valide: false,
        date_demande: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return res.json({
      success: true,
      message: 'Demande enregistrée. L\'admin validera votre accès après vérification du paiement.',
      requestId: data.id
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
