import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const { data: p } = await supabaseAdmin.from('profiles').select('role').eq('id', decoded.userId).single()
  return ['admin', 'superadmin'].includes(p?.role) ? decoded.userId : null
}

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { payment_id, user_id, type_concours } = req.body
  if (!payment_id || !user_id) return res.status(400).json({ error: 'Paramètres manquants' })

  try {
    // 1. Valider le paiement
    const { error: updateErr } = await supabaseAdmin
      .from('correction_requests')
      .update({
        status: 'approved',
        admin_response: `Validé par admin le ${new Date().toLocaleDateString('fr-FR')}`
      })
      .eq('id', payment_id)

    if (updateErr) throw updateErr

    // 2. Activer l'abonnement
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 an

    const { error: subErr } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_type: type_concours || 'direct',
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq('id', user_id)

    if (subErr) throw subErr

    return res.json({ success: true, message: 'Paiement validé et abonnement activé' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
