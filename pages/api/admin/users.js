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

  // GET: liste des utilisateurs non admin
  if (req.method === 'GET') {
    try {
      const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone, role, subscription_type, subscription_status, subscription_expires_at, created_at')
        .not('role', 'in', '("admin","superadmin")')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const userList = []
      for (const u of (users || [])) {
        const nameParts = (u.full_name || '').trim().split(' ')
        let abonnementType = u.subscription_type
        let dossierPrincipal = null
        let dossiersTousLesDebloques = []
        
        // Pour les abonnés professionnels, récupérer TOUS les dossiers depuis correction_requests
        if (u.subscription_type === 'professionnel' && u.subscription_status === 'active') {
          const { data: paidReq } = await supabaseAdmin
            .from('correction_requests')
            .select('message')
            .eq('user_id', u.id)
            .eq('status', 'approved')
            .like('message', '%ifl_payment%')
            .order('created_at', { ascending: false })
          
          if (paidReq && paidReq.length > 0) {
            const dossiersTrouves = []
            for (const req of paidReq) {
              try {
                const parsed = JSON.parse(req.message)
                if (parsed.type === 'ifl_payment' && parsed.type_concours === 'professionnel' && parsed.dossier_principal) {
                  if (!dossiersTrouves.includes(parsed.dossier_principal)) {
                    dossiersTrouves.push(parsed.dossier_principal)
                  }
                }
              } catch {}
            }
            if (dossiersTrouves.length > 0) {
              dossierPrincipal = dossiersTrouves[0]
              dossiersTousLesDebloques = dossiersTrouves
            }
          }
        }
        
        // Rétro-compatibilité: si ancien format "professionnel:NomDossier"
        if (u.subscription_type && u.subscription_type.startsWith('professionnel:')) {
          abonnementType = 'professionnel'
          dossierPrincipal = u.subscription_type.substring('professionnel:'.length)
          dossiersTousLesDebloques = [dossierPrincipal]
        }
        
        userList.push({
          id: u.id,
          nom: nameParts[0] || '',
          prenom: nameParts.slice(1).join(' ') || '',
          full_name: u.full_name,
          phone: u.phone,
          role: u.role,
          is_admin: false,
          abonnement_type: abonnementType,
          dossier_principal: dossierPrincipal,
          dossiers_principaux: dossiersTousLesDebloques,
          subscription_type_raw: u.subscription_type,
          subscription_status: u.subscription_status,
          abonnement_valide_jusqua: u.subscription_expires_at,
          subscription_expires_at: u.subscription_expires_at,
          created_at: u.created_at
        })
      }

      return new Response(JSON.stringify({ users: userList }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // PUT: modifier un utilisateur
  if (req.method === 'PUT') {
    let body = {}
    try { body = await req.json() } catch {}
    const { id, subscription_type, subscription_status, subscription_expires_at, dossier_principal } = body

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID utilisateur manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const updates = {}
      
      // La contrainte DB n'accepte que 'direct' et 'professionnel'
      // Le dossier_principal est géré via correction_requests (paiements)
      // Pour l'activation manuelle par admin, si type est professionnel,
      // on crée aussi un enregistrement dans correction_requests
      if (subscription_type !== undefined) {
        // Nettoyer le format ancien 'professionnel:xxx' si présent
        let cleanType = subscription_type || null
        if (cleanType && cleanType.startsWith('professionnel:')) {
          cleanType = 'professionnel'
        }
        updates.subscription_type = cleanType
      }
      if (subscription_status !== undefined) updates.subscription_status = subscription_status
      if (subscription_expires_at !== undefined) updates.subscription_expires_at = subscription_expires_at

      const { data: updated, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Si activation manuelle d'un abonnement professionnel avec dossier_principal,
      // créer un enregistrement dans correction_requests pour que /me puisse retrouver le dossier
      if (subscription_type === 'professionnel' && dossier_principal && subscription_status === 'active') {
        await supabaseAdmin
          .from('correction_requests')
          .insert({
            user_id: id,
            question_id: null,
            message: JSON.stringify({
              type: 'ifl_payment',
              montant: 20000,
              type_concours: 'professionnel',
              dossier_principal: dossier_principal,
              notes: 'Activation manuelle par admin',
              date_demande: new Date().toISOString()
            }),
            status: 'approved',
            admin_response: `Activé manuellement par admin le ${new Date().toLocaleDateString('fr-FR')} | Dossier: ${dossier_principal}`
          })
      }

      return new Response(JSON.stringify({ user: updated, success: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // DELETE: supprimer un utilisateur (et ses données associées)
  if (req.method === 'DELETE') {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID utilisateur manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Empêcher la suppression d'un admin
    try {
      const { data: target } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', id)
        .maybeSingle()

      if (!target) {
        return new Response(JSON.stringify({ error: 'Utilisateur introuvable' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      }
      if (['admin', 'superadmin'].includes(target.role)) {
        return new Response(JSON.stringify({ error: 'Impossible de supprimer un administrateur' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
      }
      if (target.id === adminId) {
        return new Response(JSON.stringify({ error: 'Vous ne pouvez pas vous supprimer vous-même' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
      }

      // Supprimer les données liées (best-effort, ne bloque pas en cas d'erreur)
      try { await supabaseAdmin.from('correction_requests').delete().eq('user_id', id) } catch {}
      try { await supabaseAdmin.from('user_progress').delete().eq('user_id', id) } catch {}

      // Supprimer le profil
      const { error: delErr } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', id)

      if (delErr) throw delErr

      // Tenter de supprimer le compte auth (peut échouer selon les permissions, on ignore)
      try {
        await supabaseAdmin.auth.admin.deleteUser(id)
      } catch {}

      return new Response(JSON.stringify({ success: true, message: 'Utilisateur supprimé' }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
}
