export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  }

  const decoded = await verifyToken(token)
  if (!decoded) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, subscription_status, subscription_type, subscription_expires_at')
      .eq('id', decoded.userId)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      authenticated: true,
      is_admin: ['admin', 'superadmin'].includes(profile.role),
      subscription_status: profile.subscription_status,
      subscription_type: profile.subscription_type
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  }
}
