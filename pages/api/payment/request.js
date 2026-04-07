export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req) {
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json'}})
  const res = {
    status: (s) => ({ json: (d) => R(d, s) }),
    json: (d) => R(d, 200)
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  let body = {}
  try { body = await req.json() } catch {}

  const { type_concours, montant, numero_paiement, notes } = body

  if (!type_concours) {
    return res.status(400).json({ error: 'Type de concours requis' })
  }

  const expectedAmount = type_concours === 'direct' ? 5000 : 20000
  const finalAmount = montant || expectedAmount

  try {
    // Stocker la demande de paiement dans correction_requests
    const paymentData = JSON.stringify({
      type: 'ifl_payment',
      type_concours,
      montant: finalAmount,
      numero_paiement: numero_paiement || null,
      notes: notes || null,
      date: new Date().toISOString()
    })

    const { data, error } = await supabaseAdmin
      .from('correction_requests')
      .insert({
        user_id: decoded.userId,
        question_id: null,
        message: paymentData,
        status: 'pending',
        admin_response: null
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json({
      success: true,
      message: 'Demande de paiement envoyée ! L\'admin validera votre abonnement sous 24h.',
      id: data.id
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
