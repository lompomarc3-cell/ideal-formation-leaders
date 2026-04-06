import { supabaseAdmin } from '../../../lib/supabase'
import { getUserFromToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  return user?.is_admin ? user : null
}

export default async function handler(req, res) {
  const admin = await checkAdmin(req)
  if (!admin) return res.status(403).json({ error: 'Accès admin requis' })

  if (req.method === 'GET') {
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    const { data: payments, error, count } = await supabaseAdmin
      .from('ifl_payment_requests')
      .select('*, ifl_users(nom, prenom, phone)', { count: 'exact' })
      .order('date_demande', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ payments, total: count })
  }

  if (req.method === 'PUT') {
    const { id, valide, notes_admin, type_concours, user_id } = req.body

    if (!id) return res.status(400).json({ error: 'ID requis' })

    // Mettre à jour la demande
    const { error: payError } = await supabaseAdmin
      .from('ifl_payment_requests')
      .update({
        valide,
        notes_admin,
        date_validation: valide ? new Date().toISOString() : null
      })
      .eq('id', id)

    if (payError) return res.status(500).json({ error: payError.message })

    // Si validé, activer l'abonnement de l'utilisateur
    if (valide && user_id && type_concours) {
      const validDate = new Date()
      validDate.setFullYear(validDate.getFullYear() + 1) // 1 an

      const { error: userError } = await supabaseAdmin
        .from('ifl_users')
        .update({
          abonnement_type: type_concours,
          abonnement_valide_jusqua: validDate.toISOString()
        })
        .eq('id', user_id)

      if (userError) return res.status(500).json({ error: userError.message })
    }

    return res.json({ success: true, message: valide ? 'Paiement validé et abonnement activé' : 'Paiement rejeté' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
