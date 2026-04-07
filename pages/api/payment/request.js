export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token requis' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Token invalide' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  let body = {}
  try { body = await req.json() } catch {}
  const { type_concours, montant, numero_paiement, notes } = body

  if (!type_concours) {
    return new Response(JSON.stringify({ error: 'type_concours requis (direct ou professionnel)' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  const expectedAmount = type_concours === 'direct' ? 5000 : 20000

  try {
    const { data: payment, error } = await supabaseAdmin
      .from('correction_requests')
      .insert({
        user_id: payload.userId,
        question_id: null,
        message: JSON.stringify({
          type: 'ifl_payment',
          montant: montant || expectedAmount,
          type_concours,
          numero_paiement: numero_paiement || null,
          notes: notes || null,
          date_demande: new Date().toISOString()
        }),
        status: 'pending',
        admin_response: null
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({
      success: true,
      message: 'Demande de paiement envoyée. En attente de validation.',
      payment: { id: payment.id }
    }), { status: 201, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
