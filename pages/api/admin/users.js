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

  // GET - Liste des utilisateurs
  if (req.method === 'GET') {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    const mapped = (users || []).map(u => {
      const parts = (u.full_name || '').split(' ')
      return {
        id: u.id,
        phone: u.phone,
        nom: parts[0] || '',
        prenom: parts.slice(1).join(' ') || '',
        full_name: u.full_name,
        role: u.role,
        is_admin: ['admin', 'superadmin'].includes(u.role),
        is_active: u.subscription_status !== 'blocked',
        abonnement_type: u.subscription_type,
        abonnement_valide_jusqua: u.subscription_expires_at,
        subscription_status: u.subscription_status,
        created_at: u.created_at
      }
    })

    return res.json({ users: mapped })
  }

  // PUT - Modifier un utilisateur
  if (req.method === 'PUT') {
    const { id, abonnement_type, abonnement_valide_jusqua, is_active } = req.body
    if (!id) return res.status(400).json({ error: 'ID requis' })

    const updates = {}
    if (abonnement_type !== undefined) {
      updates.subscription_type = abonnement_type || null
      updates.subscription_status = abonnement_type ? 'active' : 'free'
    }
    if (abonnement_valide_jusqua !== undefined) {
      updates.subscription_expires_at = abonnement_valide_jusqua || null
    }
    if (is_active === false) {
      updates.subscription_status = 'blocked'
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    const parts = (data.full_name || '').split(' ')
    return res.json({
      user: {
        ...data,
        nom: parts[0] || '',
        prenom: parts.slice(1).join(' ') || '',
        abonnement_type: data.subscription_type,
        abonnement_valide_jusqua: data.subscription_expires_at,
        is_active: data.subscription_status !== 'blocked'
      }
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
