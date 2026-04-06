export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = await verifyToken(token)
  if (!decoded) return null
  const { data: user } = await supabaseAdmin
    .from('ifl_users')
    .select('id, is_admin, role')
    .eq('id', decoded.userId)
    .single()
  return (user?.is_admin || user?.role === 'admin') ? decoded.userId : null
}

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method === 'GET') {
    try {
      const { data: payments, error } = await supabaseAdmin
        .from('ifl_payment_requests')
        .select('*, ifl_users(nom, prenom, phone)')
        .order('date_demande', { ascending: false })

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ payments: payments || [] })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PUT') {
    const { id, valide, user_id, type_concours, notes_admin } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    try {
      const { error: payErr } = await supabaseAdmin
        .from('ifl_payment_requests')
        .update({
          valide,
          date_validation: valide ? new Date().toISOString() : null,
          notes_admin: notes_admin || (valide ? 'Validé par admin' : 'Rejeté par admin')
        })
        .eq('id', id)

      if (payErr) return res.status(500).json({ error: payErr.message })

      if (valide && user_id && type_concours) {
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)

        const { error: subErr } = await supabaseAdmin
          .from('ifl_users')
          .update({
            abonnement_type: type_concours,
            abonnement_valide_jusqua: expiresAt.toISOString()
          })
          .eq('id', user_id)

        if (subErr) return res.status(500).json({ error: subErr.message })
      }

      return res.json({
        success: true,
        message: valide ? 'Paiement validé et abonnement activé !' : 'Paiement rejeté.'
      })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
