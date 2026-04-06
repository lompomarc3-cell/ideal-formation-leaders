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

  try {
    // Stats utilisateurs
    const { count: totalUsers } = await supabaseAdmin
      .from('ifl_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)

    // Stats abonnements actifs
    const { count: activeSubscriptions } = await supabaseAdmin
      .from('ifl_users')
      .select('*', { count: 'exact', head: true })
      .not('abonnement_type', 'is', null)
      .gt('abonnement_valide_jusqua', new Date().toISOString())

    // Stats paiements en attente
    const { count: pendingPayments } = await supabaseAdmin
      .from('ifl_payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('valide', false)

    // Stats questions
    const { count: totalQuestions } = await supabaseAdmin
      .from('ifl_questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_demo', false)

    // Derniers inscrits
    const { data: recentUsers } = await supabaseAdmin
      .from('ifl_users')
      .select('id, nom, prenom, phone, abonnement_type, created_at')
      .eq('is_admin', false)
      .order('created_at', { ascending: false })
      .limit(5)

    return res.json({
      stats: {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        pendingPayments: pendingPayments || 0,
        totalQuestions: totalQuestions || 0
      },
      recentUsers: recentUsers || []
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
