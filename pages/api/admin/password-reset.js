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
  const raw = crypto.randomUUID().replace(/-/g, '')
  const digits = raw.replace(/\D/g, '').slice(0, 4).padEnd(4, '0')
  return `IFL2026!${digits}`
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

    // Synchroniser aussi le mot de passe Supabase Auth : cela permet au compte
    // de rester utilisable par les intégrations qui passent par Auth Admin.
    const authUpdate = await fetch(`${process.env.SUPABASE_URL || 'https://cyasoaihjjochwhnhwqf.supabase.co'}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: {
        'apikey': process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-secret-key',
        'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-secret-key'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: temporary, email_confirm: true })
    })
    if (!authUpdate.ok) {
      const detail = await authUpdate.text()
      throw new Error(`Synchronisation Auth impossible: ${authUpdate.status} ${detail.slice(0, 160)}`)
    }

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
        expires_at: null
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
      message: 'Nouveau mot de passe généré. Copiez-le et communiquez-le à l’utilisateur par WhatsApp.'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Erreur lors de la réinitialisation' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
