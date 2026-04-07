export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.json({ authenticated: false })

  const decoded = verifyToken(token)
  if (!decoded) return res.json({ authenticated: false })

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, subscription_status, subscription_type, subscription_expires_at')
      .eq('id', decoded.userId)
      .single()

    if (!profile) return res.json({ authenticated: false })

    return res.json({
      authenticated: true,
      is_admin: ['admin', 'superadmin'].includes(profile.role),
      subscription_status: profile.subscription_status,
      subscription_type: profile.subscription_type
    })
  } catch {
    return res.json({ authenticated: false })
  }
}
