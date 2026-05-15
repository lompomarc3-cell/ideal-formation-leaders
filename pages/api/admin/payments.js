export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

async function checkAdmin(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', payload.userId)
    .maybeSingle()
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) return null
  return profile.id
}

export default async function handler(req) {
  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  // GET: lister les demandes de paiement
  if (req.method === 'GET') {
    try {
      // 🔧 FIX #4 : Optimisation - filtre côté serveur 'status', et batch la récupération des profiles
      const url = new URL(req.url)
      const statusFilter = url.searchParams.get('status') // pending | approved | rejected
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500)

      let query = supabaseAdmin
        .from('correction_requests')
        .select('id, user_id, message, status, admin_response, created_at')
        .like('message', '%ifl_payment%')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
        query = query.eq('status', statusFilter)
      }

      const { data: requests, error } = await query

      if (error) throw error

      // 🚀 OPTIMISATION CRITIQUE : Au lieu d'une requête profiles par paiement (N+1),
      // on récupère TOUS les profiles concernés en UNE SEULE requête (`in` filter).
      const userIds = [...new Set((requests || []).map(r => r.user_id).filter(Boolean))]
      let profilesMap = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, phone, subscription_type')
          .in('id', userIds)
        if (profiles) {
          for (const p of profiles) profilesMap[p.id] = p
        }
      }

      const payments = []
      for (const r of requests || []) {
        let parsed = {}
        try { parsed = JSON.parse(r.message) } catch {}
        const profile = profilesMap[r.user_id] || null
        const nameParts = (profile?.full_name || '').split(' ')
        payments.push({
          id: r.id,
          user_id: r.user_id,
          montant: parsed.montant || 0,
          type_concours: parsed.type_concours || 'direct',
          dossier_principal: parsed.dossier_principal || null,
          numero_paiement: parsed.numero_paiement || null,
          capture_url: parsed.capture_url || null,
          notes: parsed.notes || null,
          // Statut explicite (source de vérité) : pending | approved | rejected
          status: r.status || 'pending',
          valide: r.status === 'approved',
          date_demande: r.created_at,
          admin_notes: r.admin_response,
          admin_response: r.admin_response,
          nom: nameParts[0] || '',
          prenom: nameParts.slice(1).join(' ') || '',
          full_name: profile?.full_name || '',
          phone: profile?.phone || '',
          current_subscription: profile?.subscription_type || null
        })
      }

      return new Response(JSON.stringify({ payments }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Cache court côté CDN pour réduire la charge
          'Cache-Control': 'private, no-cache'
        }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // PUT: valider ou rejeter un paiement
  if (req.method === 'PUT') {
    let body = {}
    try { body = await req.json() } catch {}
    const { id, valide, type_concours, dossier_principal, notes_admin } = body
    let { user_id } = body

    if (!id || valide === undefined) {
      return new Response(JSON.stringify({ error: 'Paramètres manquants (id, valide)' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const newStatus = valide ? 'approved' : 'rejected'
      const dateFr = new Date().toLocaleDateString('fr-FR')

      // 🔍 Récupérer la demande pour extraire user_id et le type/dossier réel depuis le message JSON
      const { data: existingReq } = await supabaseAdmin
        .from('correction_requests')
        .select('id, user_id, message, status')
        .eq('id', id)
        .maybeSingle()

      if (!existingReq) {
        return new Response(JSON.stringify({ error: 'Demande de paiement introuvable' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      }

      // Si user_id n'est pas fourni par le client, on le récupère depuis la base (source de vérité)
      if (!user_id) user_id = existingReq.user_id

      // Extraire les vrais type/dossier depuis le message JSON (source de vérité)
      let realType = type_concours
      let realDossier = dossier_principal
      if (existingReq && existingReq.message) {
        try {
          const parsed = JSON.parse(existingReq.message)
          if (parsed && parsed.type === 'ifl_payment') {
            realType = parsed.type_concours || realType
            realDossier = parsed.dossier_principal || realDossier
          }
        } catch {}
      }

      // Mettre à jour la demande avec un message admin clair
      const adminResponse = notes_admin || (valide
        ? `Paiement validé par admin le ${dateFr}${realDossier ? ' — Dossier : ' + realDossier : ''}`
        : `Paiement rejeté par admin le ${dateFr}`)

      const { error: updateErr } = await supabaseAdmin
        .from('correction_requests')
        .update({
          status: newStatus,
          admin_response: adminResponse
        })
        .eq('id', id)

      if (updateErr) throw updateErr

      // Si validé : activer l'abonnement et donner accès TOTAL à toutes les questions du dossier
      if (valide) {
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)

        // 🔧 FIX #3 : NE PAS écraser un abonnement direct existant si on valide un pro (et vice versa).
        // L'API /me + /quiz/questions parcourent tous les paiements approuvés (cumul direct + pro).
        // On garde subscription_type sur la valeur la plus permissive existante.
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('subscription_type, subscription_status, subscription_expires_at')
          .eq('id', user_id)
          .maybeSingle()

        const now = new Date()
        const existingActive = existing && existing.subscription_status === 'active' &&
          (!existing.subscription_expires_at || new Date(existing.subscription_expires_at) > now)

        // Détermine le subscription_type final
        // Si existant actif et différent de realType → on met 'all' (mais la DB n'accepte que direct/professionnel)
        // → on garde la valeur existante (le calcul réel se fait via correction_requests dans /me)
        let subscriptionTypeValue = (realType === 'professionnel' ? 'professionnel' : 'direct')
        if (existingActive && existing.subscription_type && existing.subscription_type !== subscriptionTypeValue) {
          // Conserver le type existant : peu importe, le calcul réel est dans correction_requests
          // On préfère garder ce qui était (rétro-compat)
          subscriptionTypeValue = existing.subscription_type
        }

        // Calcul de la date d'expiration : on garde la plus lointaine
        let finalExpiresAt = expiresAt
        if (existingActive && existing.subscription_expires_at) {
          const ex = new Date(existing.subscription_expires_at)
          if (ex > finalExpiresAt) finalExpiresAt = ex
        }

        // 🚨 CORRECTION CRITIQUE : forcer subscription_status='active' pour débloquer
        // TOUTES les questions du dossier (et pas juste les 5 premières gratuites)
        const { error: profileErr } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_type: subscriptionTypeValue,
            subscription_expires_at: finalExpiresAt.toISOString()
          })
          .eq('id', user_id)

        if (profileErr) throw profileErr
      }
      // Si rejeté : on NE touche PAS au profil — l'utilisateur garde son état actuel
      // (s'il avait déjà un autre paiement validé, il conserve ses accès ; sinon il reste limité aux 5 questions gratuites)

      return new Response(JSON.stringify({
        success: true,
        message: valide
          ? `✅ Paiement validé — accès complet activé pour l'abonnement ${realType}${realDossier ? ' (' + realDossier + ')' : ''}`
          : `❌ Paiement rejeté — l'utilisateur n'aura pas accès aux questions complètes`,
        type_concours: realType,
        dossier_principal: realDossier,
        status: newStatus
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
}
