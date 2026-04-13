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

    // 2. Activer l'abonnement
    // La contrainte CHECK n'accepte que 'direct' et 'professionnel'
    // Le dossier_principal est stocké dans correction_requests.admin_response
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 an

    const subscriptionTypeValue = type_concours || 'direct'
    // Note: 'professionnel:dossier' n'est pas accepté par la contrainte DB
    // On stocke juste 'professionnel', le dossier est dans correction_requests

    const { error: subErr } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_type: subscriptionTypeValue,
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq('id', user_id)

    if (subErr) throw subErr

    return R({ 
      success: true, 
      message: `✅ Paiement validé – abonnement ${type_concours}${dossier_principal ? ' (' + dossier_principal + ')' : ''} activé pour 1 an`
    })
  } catch (error) {
    return R({ error: error.message }, 500)
  }
}
