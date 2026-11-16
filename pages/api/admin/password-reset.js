export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken, hashPassword } from '../../../lib/auth'

async function checkAdmin(req) {
  const raw = req.headers.get('authorization') || ''
  const token = raw.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload?.userId) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', payload.userId)
    .maybeSingle()
  return profile && ['admin', 'superadmin'].includes(profile.role) ? profile.id : null
}

function temporaryPassword() {
  const raw = crypto.randomUUID().replace(/-/g, '').toUpperCase()
  return `IFL-${raw.slice(0, 4)}-${raw.slice(4, 8)}`
}

export default async function handler(req) {
  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  let body = {}
  try { body = await req.json() } catch {}
  const userId = String(body.user_id || '').trim()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'ID utilisateur manquant' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { data: target, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id, phone, full_name, role')
      .eq('id', userId)
      .maybeSingle()
    if (targetError) throw targetError
    if (!target) {
      return new Response(JSON.stringify({ error: 'Utilisateur introuvable' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }
    if (['admin', 'superadmin'].includes(target.role)) {
      return new Response(JSON.stringify({ error: 'Réinitialisation interdite pour un administrateur' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      })
    }

    const temporary = temporaryPassword()
    const passwordHash = await hashPassword(temporary)

    // Le système IFL authentifie les utilisateurs via le dernier enregistrement ifl_auth.
    const { error: authError } = await supabaseAdmin
      .from('correction_requests')
      .insert({
        user_id: userId,
        question_id: null,
        message: JSON.stringify({
          type: 'ifl_auth',
          password_hash: passwordHash,
          source: 'admin_password_reset',
          admin_id: adminId,
          created_at: new Date().toISOString()
        }),
        status: 'approved',
        admin_response: passwordHash
      })
    if (authError) throw authError

    // Journal dédié : aucun mot de passe en clair n'est stocké dans Supabase.
    const { error: requestError } = await supabaseAdmin
      .from('password_reset_requests')
      .insert({
        user_id: userId,
        phone: target.phone,
        otp_hash: passwordHash,
        channel: 'admin',
        status: 'issued',
        attempts: 0,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    if (requestError) {
      // Le changement d'authentification reste valide si le journal dédié est absent.
      console.error('[admin-password-reset] journal_error', requestError.message)
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'issued',
      user: { id: target.id, phone: target.phone, full_name: target.full_name },
      temporary_password: temporary,
      expires_in_hours: 24,
      message: 'Mot de passe temporaire généré. Communiquez-le à l’utilisateur puis demandez-lui de le changer.'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Erreur lors de la réinitialisation' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
