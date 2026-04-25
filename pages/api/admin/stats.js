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
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }

  const adminId = await checkAdmin(req)
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    // Total utilisateurs (non admin)
    const { data: allUsers } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, subscription_type, subscription_status, created_at')
      .not('role', 'in', '("admin","superadmin")')
      .order('created_at', { ascending: false })

    const totalUsers = allUsers ? allUsers.length : 0
    const activeSubscriptions = allUsers ? allUsers.filter(u => u.subscription_status === 'active').length : 0
    const directSubscribers = allUsers ? allUsers.filter(u => u.subscription_type === 'direct' && u.subscription_status === 'active').length : 0
    const proSubscribers = allUsers ? allUsers.filter(u => u.subscription_type === 'professionnel' && u.subscription_status === 'active').length : 0

    // Total questions actives
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id, category_id')
      .eq('is_active', true)
    const totalQuestions = questions ? questions.length : 0

    // Catégories actives avec comptage de questions
    const { data: cats } = await supabaseAdmin
      .from('categories')
      .select('id, nom, type, question_count, is_active, created_at')
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('created_at', { ascending: true })
    
    const totalCategories = cats ? cats.length : 0
    const totalDirect = cats ? cats.filter(c => c.type === 'direct').length : 0
    const totalPro = cats ? cats.filter(c => c.type === 'professionnel').length : 0

    // Paiements en attente
    const { data: pendingPayments } = await supabaseAdmin
      .from('correction_requests')
      .select('id')
      .eq('status', 'pending')
      .like('message', '%ifl_payment%')
    const pendingPaymentsCount = pendingPayments ? pendingPayments.length : 0

    // Paiements validés total
    const { data: approvedPayments } = await supabaseAdmin
      .from('correction_requests')
      .select('id')
      .eq('status', 'approved')
      .like('message', '%ifl_payment%')
    const approvedPaymentsCount = approvedPayments ? approvedPayments.length : 0

    // Questions par catégorie (enrichies)
    const questionsByCategory = (cats || []).map(c => {
      const qCount = questions ? questions.filter(q => q.category_id === c.id).length : 0
      return {
        id: c.id,
        nom: c.nom,
        type: c.type,
        question_count: qCount
      }
    })

    // 10 derniers inscrits — avec dossiers pro débloqués
    const recentUsersSlice = (allUsers || []).slice(0, 10)
    const recentUsers = []
    for (const u of recentUsersSlice) {
      const nameParts = (u.full_name || '').trim().split(' ')
      let dossiersPrincipaux = []
      if (u.subscription_type === 'professionnel' && u.subscription_status === 'active') {
        const { data: paidReq } = await supabaseAdmin
          .from('correction_requests')
          .select('message')
          .eq('user_id', u.id)
          .eq('status', 'approved')
          .like('message', '%ifl_payment%')
        if (paidReq) {
          for (const r of paidReq) {
            try {
              const parsed = JSON.parse(r.message)
              if (parsed.type === 'ifl_payment' && parsed.type_concours === 'professionnel' && parsed.dossier_principal) {
                if (!dossiersPrincipaux.includes(parsed.dossier_principal)) {
                  dossiersPrincipaux.push(parsed.dossier_principal)
                }
              }
            } catch {}
          }
        }
      }
      recentUsers.push({
        id: u.id,
        nom: nameParts[0] || '',
        prenom: nameParts.slice(1).join(' ') || '',
        full_name: u.full_name,
        phone: u.phone,
        abonnement_type: u.subscription_type,
        subscription_status: u.subscription_status,
        dossiers_principaux: dossiersPrincipaux,
        created_at: u.created_at
      })
    }

    return new Response(JSON.stringify({
      stats: {
        totalUsers,
        activeSubscriptions,
        directSubscribers,
        proSubscribers,
        pendingPayments: pendingPaymentsCount,
        approvedPayments: approvedPaymentsCount,
        totalQuestions,
        totalCategories,
        totalDirect,
        totalPro
      },
      questionsByCategory,
      recentUsers
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
