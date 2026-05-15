export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const decoded = await verifyToken(token)
  if (!decoded) return null
  const { data: p } = await supabaseAdmin.from('profiles').select('role').eq('id', decoded.userId).single()
  return ['admin', 'superadmin'].includes(p?.role) ? decoded.userId : null
}

export default async function handler(req) {
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json'}})

  const adminId = await checkAdmin(req)
  if (!adminId) return R({ error: 'Accès refusé' }, 403)

  if (req.method !== 'POST') return R({ error: 'Method not allowed' }, 405)

  let body = {}
  try { body = await req.json() } catch {}
  
  const { payment_id, user_id, type_concours, dossier_principal } = body
  if (!payment_id || !user_id) return R({ error: 'Paramètres manquants' }, 400)

  try {
    // 1. Valider le paiement
    const { error: updateErr } = await supabaseAdmin
      .from('correction_requests')
      .update({
        status: 'approved',
        admin_response: `Validé par admin le ${new Date().toLocaleDateString('fr-FR')}${dossier_principal ? ' | Dossier: ' + dossier_principal : ''}`
      })
      .eq('id', payment_id)

    if (updateErr) throw updateErr

    // 2. Activer/mettre à jour l'abonnement de l'utilisateur
    // 🔧 FIX #3 : Cumul direct + pro pris en charge via correction_requests
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const subscriptionTypeValue = type_concours || 'direct'

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, subscription_type, subscription_expires_at')
      .eq('id', user_id)
      .single()

    const now = new Date()
    const existingActive = existingProfile && existingProfile.subscription_status === 'active' &&
      (!existingProfile.subscription_expires_at || new Date(existingProfile.subscription_expires_at) > now)

    // Détermine le subscription_type final : conserve l'existant s'il est actif et différent
    let finalType = subscriptionTypeValue
    if (existingActive && existingProfile.subscription_type && existingProfile.subscription_type !== finalType) {
      finalType = existingProfile.subscription_type
    }

    // Garde la date d'expiration la plus lointaine
    let finalExpiresAt = expiresAt
    if (existingActive && existingProfile.subscription_expires_at) {
      const ex = new Date(existingProfile.subscription_expires_at)
      if (ex > finalExpiresAt) finalExpiresAt = ex
    }

    const updateData = {
      subscription_status: 'active',
      subscription_type: finalType,
      subscription_expires_at: finalExpiresAt.toISOString()
    }

    const { error: subErr } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user_id)

    if (subErr) throw subErr

    return R({ 
      success: true, 
      message: `✅ Paiement validé – abonnement ${type_concours}${dossier_principal ? ' (' + dossier_principal + ')' : ''} activé`
    })
  } catch (error) {
    return R({ error: error.message }, 500)
  }
}
