export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
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

export default async function handler(req) {
  // Helper pour compatibilité Edge Runtime
  let body = {}
  if (req.method !== 'GET') {
    try { body = await req.json() } catch {}
  }
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json'}})
  const res = {
    status: (s) => ({ json: (d) => R(d, s) }),
    json: (d) => R(d, 200)
  }
  const reqData = { body, method: req.method, query: {}, headers: req.headers }

  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  try {
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('role', 'in', '("superadmin","admin")')

    const { count: totalQuestions } = await supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: totalCategories } = await supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Compter les paiements en attente
    const { count: pendingPayments } = await supabaseAdmin
      .from('correction_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .like('message', '%ifl_payment%')

    // Compter les abonnements actifs
    const { count: activeSubscriptions } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')

    // Derniers utilisateurs
    const { data: recentUsers } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, subscription_type, subscription_status, created_at')
      .not('role', 'in', '("superadmin","admin")')
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
      recentUsers: (recentUsers || []).map(u => {
        const [nom, ...prenomParts] = (u.full_name || '').split(' ')
        return {
          ...u,
          nom: nom || '',
          prenom: prenomParts.join(' ') || '',
          abonnement_type: u.subscription_type
        }
      })
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
