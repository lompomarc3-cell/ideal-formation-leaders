export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = await verifyToken(token)
  if (!decoded) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', decoded.userId)
    .single()
  return (profile?.role === 'superadmin' || profile?.role === 'admin') ? decoded.userId : null
}

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method === 'GET') {
    try {
      // Récupérer les demandes de paiement depuis correction_requests
      const { data: payments, error } = await supabaseAdmin
        .from('correction_requests')
        .select('id, user_id, message, status, admin_response, created_at')
        .like('message', '%ifl_payment%')
        .order('created_at', { ascending: false })

      if (error) return res.status(500).json({ error: error.message })

      // Enrichir avec les infos utilisateurs
      const enriched = []
      for (const p of payments || []) {
        let paymentData = {}
        try { paymentData = JSON.parse(p.message) } catch {}
        
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, phone')
          .eq('id', p.user_id)
          .single()

        const [nom, ...prenomParts] = (profile?.full_name || '').split(' ')
        
        enriched.push({
          id: p.id,
          user_id: p.user_id,
          montant: paymentData.montant || 0,
          type_concours: paymentData.type_concours || 'direct',
          capture_url: paymentData.capture_url || null,
          numero_paiement: paymentData.numero_paiement || null,
          valide: p.status === 'approved',
          date_demande: p.created_at,
          date_validation: p.status === 'approved' ? p.updated_at : null,
          notes_admin: p.admin_response,
          status: p.status,
          profiles: {
            nom: nom || '',
            prenom: prenomParts.join(' ') || '',
            phone: profile?.phone || ''
          }
        })
      }

      return res.json({ payments: enriched })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PUT') {
    const { id, valide, user_id, type_concours, notes_admin } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    try {
      const newStatus = valide ? 'approved' : 'rejected'
      
      const { error: payErr } = await supabaseAdmin
        .from('correction_requests')
        .update({
          status: newStatus,
          admin_response: notes_admin || (valide ? 'Validé par admin' : 'Rejeté par admin')
        })
        .eq('id', id)

      if (payErr) return res.status(500).json({ error: payErr.message })

      // Si validé, activer l'abonnement
      if (valide && user_id && type_concours) {
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)

        const { error: subErr } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_type: type_concours,
            subscription_expires_at: expiresAt.toISOString()
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
