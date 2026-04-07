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
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json'}})
  const res = {
    status: (s) => ({ json: (d) => R(d, s) }),
    json: (d) => R(d, 200)
  }
  let body = {}
  if (req.method !== 'GET') {
    try { body = await req.json() } catch {}
  }

  const adminId = await checkAdmin(req)
  if (!adminId) return res.status(403).json({ error: 'Accès refusé' })

  if (req.method === 'GET') {
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

      // Paiements en attente (stockés dans correction_requests avec ifl_payment)
      const { count: pendingPayments } = await supabaseAdmin
        .from('correction_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .like('message', '%ifl_payment%')

      const { count: activeSubscriptions } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active')

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
          const parts = (u.full_name || '').trim().split(' ')
          const nom = parts[0] || ''
          const prenom = parts.slice(1).join(' ') || ''
          return {
            ...u,
            nom,
            prenom,
            abonnement_type: u.subscription_type
          }
        })
      })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
