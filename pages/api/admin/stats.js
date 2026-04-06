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

  try {
    // Compter les utilisateurs (sauf admins)
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')

    // Abonnements actifs
    const { count: activeSubscriptions } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')

    // Total questions
    const { count: totalQuestions } = await supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total catégories
    const { count: totalCategories } = await supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact', head: true })

    // Paiements en attente
    const { count: pendingPayments } = await supabaseAdmin
      .from('correction_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .like('message', '%"type":"payment"%')

    // Derniers inscrits
    const { data: recentRaw } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, subscription_type, subscription_status, subscription_expires_at, created_at')
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(10)

    const recentUsers = (recentRaw || []).map(u => {
      const parts = (u.full_name || '').split(' ')
      return {
        ...u,
        nom: parts[0] || '',
        prenom: parts.slice(1).join(' ') || '',
        abonnement_type: u.subscription_type
      }
    })

    return res.json({
      stats: {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalQuestions: totalQuestions || 0,
        totalCategories: totalCategories || 0,
        pendingPayments: pendingPayments || 0
      },
      recentUsers
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
