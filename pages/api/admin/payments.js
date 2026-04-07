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
      const { data: requests, error } = await supabaseAdmin
        .from('correction_requests')
        .select('id, user_id, message, status, admin_response, created_at')
        .like('message', '%ifl_payment%')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const payments = []
      for (const r of requests || []) {
        let parsed = {}
        try { parsed = JSON.parse(r.message) } catch {}
        
        // Récupérer infos utilisateur
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, phone')
          .eq('id', r.user_id)
          .maybeSingle()

        const nameParts = (profile?.full_name || '').split(' ')
        payments.push({
          id: r.id,
          user_id: r.user_id,
          montant: parsed.montant || 0,
          type_concours: parsed.type_concours || 'direct',
          numero_paiement: parsed.numero_paiement || null,
          capture_url: parsed.capture_url || null,
          notes: parsed.notes || null,
          valide: r.status === 'approved',
          date_demande: r.created_at,
          admin_notes: r.admin_response,
          nom: nameParts[0] || '',
          prenom: nameParts.slice(1).join(' ') || '',
          full_name: profile?.full_name || '',
          phone: profile?.phone || ''
        })
      }

      return new Response(JSON.stringify({ payments }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // PUT: valider ou rejeter un paiement
  if (req.method === 'PUT') {
    let body = {}
    try { body = await req.json() } catch {}
    const { id, valide, user_id, type_concours, notes_admin } = body

    if (!id || !user_id || valide === undefined) {
      return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const newStatus = valide ? 'approved' : 'rejected'
      
      // Mettre à jour la demande
      const { error: updateErr } = await supabaseAdmin
        .from('correction_requests')
        .update({
          status: newStatus,
          admin_response: notes_admin || (valide ? 'Paiement validé par admin' : 'Paiement rejeté')
        })
        .eq('id', id)

      if (updateErr) throw updateErr

      // Si validé, activer l'abonnement
      if (valide) {
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        
        const { error: profileErr } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_type: type_concours,
            subscription_expires_at: expiresAt.toISOString()
          })
          .eq('id', user_id)

        if (profileErr) throw profileErr
      }

      return new Response(JSON.stringify({
        success: true,
        message: valide
          ? `✅ Paiement validé – abonnement ${type_concours} activé pour 1 an`
          : '❌ Paiement rejeté'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
}
