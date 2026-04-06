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

  try {
    const { count: totalUsers } = await supabaseAdmin
      .from('ifl_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)

    const { count: totalQuestions } = await supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: totalCategories } = await supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: pendingPayments } = await supabaseAdmin
      .from('ifl_payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('valide', false)

    const { count: activeSubscriptions } = await supabaseAdmin
      .from('ifl_users')
      .select('*', { count: 'exact', head: true })
      .not('abonnement_type', 'is', null)

    const { data: recentUsers } = await supabaseAdmin
      .from('ifl_users')
      .select('id, nom, prenom, phone, abonnement_type, created_at')
      .eq('is_admin', false)
      .order('created_at', { ascending: false })
      .limit(10)

    return res.json({
      stats: {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalQuestions: totalQuestions || 0,
        totalCategories: totalCategories || 0,
        pendingPayments: pendingPayments || 0
      },
      recentUsers: recentUsers || []
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
