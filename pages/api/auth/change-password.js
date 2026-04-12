export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyPassword, hashPassword, verifyToken } from '../../../lib/auth'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  // Vérifier l'authentification
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  const payload = await verifyToken(token)
  if (!payload?.userId) {
    return new Response(JSON.stringify({ error: 'Token invalide' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  let body = {}
  try { body = await req.json() } catch {}
  const { oldPassword, newPassword } = body

  if (!oldPassword || !newPassword) {
    return new Response(JSON.stringify({ error: 'Ancien et nouveau mot de passe requis' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  if (newPassword.length < 6) {
    return new Response(JSON.stringify({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const userId = payload.userId

    // Récupérer le hash actuel depuis correction_requests
    const { data: authRecords } = await supabaseAdmin
      .from('correction_requests')
      .select('id, message, admin_response')
      .eq('user_id', userId)
      .not('message', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    let currentPasswordHash = null
    let authRecordId = null

    if (authRecords && authRecords.length > 0) {
      for (const record of authRecords) {
        try {
          const parsed = JSON.parse(record.message)
          if (parsed.type === 'ifl_auth' && parsed.password_hash) {
            currentPasswordHash = parsed.password_hash
            authRecordId = record.id
            break
          }
        } catch {}
        if (!currentPasswordHash && record.admin_response && record.admin_response.startsWith('sha256:')) {
          currentPasswordHash = record.admin_response
          authRecordId = record.id
          break
        }
      }
    }

    if (!currentPasswordHash) {
      return new Response(JSON.stringify({ error: 'Impossible de vérifier le mot de passe actuel' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Vérifier l'ancien mot de passe
    const isValid = await verifyPassword(oldPassword, currentPasswordHash)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Ancien mot de passe incorrect' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Hasher le nouveau mot de passe
    const newHash = await hashPassword(newPassword)

    // Mettre à jour en insérant un nouveau enregistrement avec le nouveau hash
    const { error: updateError } = await supabaseAdmin
      .from('correction_requests')
      .insert({
        user_id: userId,
        message: JSON.stringify({ type: 'ifl_auth', password_hash: newHash }),
        status: 'resolved',
        created_at: new Date().toISOString()
      })

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la mise à jour du mot de passe' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'Mot de passe modifié avec succès' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
