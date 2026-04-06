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

  // GET - Liste des demandes de paiement
  if (req.method === 'GET') {
    const { data: payments, error } = await supabaseAdmin
      .from('correction_requests')
      .select('*, profiles(full_name, phone)')
      .like('message', '%"type":"payment"%')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    // Décoder les messages JSON
    const decoded = (payments || []).map(p => {
      let payData = {}
      try { payData = JSON.parse(p.message) } catch {}
      return {
        ...p,
        montant: payData.montant,
        type_concours: payData.type_concours,
        capture_url: payData.capture_url,
        numero_paiement: payData.numero_paiement,
        notes: payData.notes,
        valide: p.status === 'approved',
        date_demande: p.created_at,
        user_name: p.profiles?.full_name,
        user_phone: p.profiles?.phone
      }
    })

    return res.json({ payments: decoded })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
