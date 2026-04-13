export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

// Dossiers d'accompagnement automatiquement débloqués avec tout abonnement professionnel
const DOSSIERS_ACCOMPAGNEMENT = [
  'Actualités et culture générale',
  'Entraînement QCM',
  'Accompagnement final'
]

// Calcule les dossiers débloqués pour un utilisateur professionnel
function getDossiersDebloques(dossier_principal) {
  if (!dossier_principal) return DOSSIERS_ACCOMPAGNEMENT
  return [dossier_principal, ...DOSSIERS_ACCOMPAGNEMENT]
}

export default async function handler(req) {
  const R = (data, status=200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json'}})
  const res = {
    status: (s) => ({ json: (d) => R(d, s) }),
    json: (d) => R(d, 200)
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const decoded = await verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token invalide' })

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (error || !profile) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    const isAdmin = profile.role === 'superadmin' || profile.role === 'admin'
    const nameParts = (profile.full_name || '').trim().split(' ')
    const nom = nameParts[0] || ''
    const prenom = nameParts.slice(1).join(' ') || ''

    const abonnementType = profile.subscription_type || null

    // Pour les abonnements professionnels, récupérer le dossier_principal
    // depuis le paiement approuvé (correction_requests)
    let dossier_principal = null
    if (abonnementType === 'professionnel' && profile.subscription_status === 'active') {
      const { data: paymentRequests } = await supabaseAdmin
        .from('correction_requests')
        .select('message')
        .eq('user_id', decoded.userId)
        .eq('status', 'approved')
        .like('message', '%ifl_payment%')
        .order('created_at', { ascending: false })
        .limit(1)

      if (paymentRequests && paymentRequests.length > 0) {
        try {
          const parsed = JSON.parse(paymentRequests[0].message)
          if (parsed.type === 'ifl_payment' && parsed.type_concours === 'professionnel') {
            dossier_principal = parsed.dossier_principal || null
          }
        } catch {}
      }
    }

    // Calculer les dossiers débloqués
    const dossiersDebloques = abonnementType === 'professionnel' 
      ? getDossiersDebloques(dossier_principal)
      : null // null = soit tous (direct/admin), soit aucun

    return res.json({
      id: profile.id,
      phone: profile.phone,
      nom,
      prenom,
      full_name: profile.full_name,
      role: profile.role,
      is_admin: isAdmin,
      // Abonnement
      abonnement_type: abonnementType,
      abonnement_valide_jusqua: profile.subscription_expires_at,
      subscription_status: profile.subscription_status,
      // Dossier principal pour abonnement professionnel
      dossier_principal: dossier_principal,
      dossiers_debloques: dossiersDebloques,
      is_active: true
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message })
  }
}
