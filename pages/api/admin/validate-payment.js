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
    // Si c'est un abonnement professionnel supplémentaire, on ne change pas le subscription_type
    // On met juste à jour subscription_status = 'active' et expires_at
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const subscriptionTypeValue = type_concours || 'direct'

    // Vérifier si l'utilisateur a déjà un abonnement actif du même type
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, subscription_type, subscription_expires_at')
      .eq('id', user_id)
      .single()

    // Pour un abonnement professionnel supplémentaire : conserver le type 'professionnel'
    // et mettre à jour la date d'expiration seulement si elle est antérieure
    let updateData = {
      subscription_status: 'active',
      subscription_type: subscriptionTypeValue,
    }

    // Si l'utilisateur a déjà un abonnement pro actif, on garde la date la plus lointaine
    if (existingProfile && 
        existingProfile.subscription_type === 'professionnel' && 
        existingProfile.subscription_status === 'active' &&
        type_concours === 'professionnel') {
      const existingExpiry = existingProfile.subscription_expires_at 
        ? new Date(existingProfile.subscription_expires_at) 
        : new Date()
      // Garde la date la plus lointaine
      updateData.subscription_expires_at = expiresAt > existingExpiry 
        ? expiresAt.toISOString() 
        : existingProfile.subscription_expires_at
    } else {
      updateData.subscription_expires_at = expiresAt.toISOString()
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
