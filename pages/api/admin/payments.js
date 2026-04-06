import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const { data: p } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', decoded.userId)
    .single()
  return ['admin', 'superadmin'].includes(p?.role) ? decoded.userId : null
}

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  // GET - Liste des paiements
  if (req.method === 'GET') {
    const { data: payments, error } = await supabaseAdmin
      .from('correction_requests')
      .select('*, profiles(full_name, phone)')
      .like('message', '%"type":"payment"%')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    const decoded = (payments || []).map(p => {
      let payData = {}
      try { payData = JSON.parse(p.message) } catch {}
      const parts = (p.profiles?.full_name || '').split(' ')
      return {
        id: p.id,
        user_id: p.user_id,
        montant: payData.montant,
        type_concours: payData.type_concours,
        capture_url: payData.capture_url,
        numero_paiement: payData.numero_paiement,
        notes: payData.notes,
        valide: p.status === 'approved',
        date_demande: p.created_at,
        ifl_users: {
          nom: parts[0] || '',
          prenom: parts.slice(1).join(' ') || '',
          phone: p.profiles?.phone
        }
      }
    })

    return res.json({ payments: decoded })
  }

  // PUT - Valider ou rejeter un paiement
  if (req.method === 'PUT') {
    const { id, valide, user_id, type_concours, notes_admin } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    // Mettre à jour le statut du paiement
    const newStatus = valide ? 'approved' : 'rejected'
    const { error: updateErr } = await supabaseAdmin
      .from('correction_requests')
      .update({
        status: newStatus,
        admin_response: notes_admin || (valide ? 'Validé par admin' : 'Rejeté par admin')
      })
      .eq('id', id)

    if (updateErr) return res.status(500).json({ error: updateErr.message })

    // Si validé, activer l'abonnement de l'utilisateur
    if (valide && user_id && type_concours) {
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_type: type_concours,
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', user_id)
    }

    return res.json({
      success: true,
      message: valide
        ? `✅ Paiement validé ! Abonnement "${type_concours}" activé pour 1 an.`
        : '❌ Paiement rejeté.'
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
