import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', decoded.userId).single()
  if (!['admin', 'superadmin'].includes(profile?.role)) return null
  return decoded.userId
}

export default async function handler(req, res) {
  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  try {
    const { data: allProfiles } = await supabaseAdmin.from('profiles').select('*')
    const { count: totalUsers } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'superadmin')
    const { count: activeSubscriptions } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active')
    const { count: totalQuestions } = await supabaseAdmin.from('questions').select('*', { count: 'exact', head: true })
    const { count: totalCategories } = await supabaseAdmin.from('categories').select('*', { count: 'exact', head: true })
    
    // Paiements en attente
    const { count: pendingPayments } = await supabaseAdmin
      .from('correction_requests')
      .select('*', { count: 'exact', head: true })
      .like('message', '%"type":"payment"%')
      .eq('status', 'pending')

    const recentUsers = allProfiles?.filter(p => !['admin', 'superadmin'].includes(p.role)).slice(-10).reverse() || []

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
