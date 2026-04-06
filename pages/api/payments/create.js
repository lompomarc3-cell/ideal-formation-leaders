import { supabaseAdmin } from '../../../lib/supabase'
import { getUserFromToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]
  const user = await getUserFromToken(token)

  if (!user) return res.status(401).json({ error: 'Connexion requise' })

  const { type_concours, numero_paiement } = req.body

  if (!type_concours || !['direct', 'professionnel'].includes(type_concours)) {
    return res.status(400).json({ error: 'Type de concours invalide' })
  }

  // Obtenir le prix depuis les catégories
  const { data: catSample } = await supabaseAdmin
    .from('categories')
    .select('prix')
    .eq('type', type_concours)
    .limit(1)
    .single()

  const montant = catSample?.prix || (type_concours === 'direct' ? 5000 : 20000)

  try {
    // Vérifier qu'il n'y a pas déjà une demande en attente
    const { data: existing } = await supabaseAdmin
      .from('payment_requests')
      .select('id, valide')
      .eq('user_id', user.id)
      .eq('type_concours', type_concours)
      .eq('valide', false)
      .maybeSingle()

    if (existing) {
      return res.status(400).json({ 
        error: 'Vous avez déjà une demande de paiement en attente pour ce type de concours.',
        payment_id: existing.id
      })
    }

    const { data: payment, error } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: user.id,
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
      message: 'Demande de paiement créée. Envoyez votre capture WhatsApp au +22676223962'
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
