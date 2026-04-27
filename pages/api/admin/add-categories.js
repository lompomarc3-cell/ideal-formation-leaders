export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

// SECURITY: This one-shot migration helper now requires a valid admin JWT.
// The previous shared-secret protection has been removed.
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Require admin auth
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token requis' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }
  let payload
  try { payload = await verifyToken(token) } catch {
    return new Response(JSON.stringify({ error: 'Token invalide' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }
  const userId = payload?.userId
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Token invalide' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id, role').eq('id', userId).maybeSingle()
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    })
  }

  const newCategories = [
    {
      nom: 'Actualités et Culture Générale',
      type: 'professionnel',
      description: 'Actualités internationales, culture générale approfondie et enjeux contemporains',
      prix: 20000,
      is_active: true,
      question_count: 0
    },
    {
      nom: 'Justice',
      type: 'professionnel',
      description: 'Droit judiciaire, procédures juridiques et système judiciaire burkinabè',
      prix: 20000,
      is_active: true,
      question_count: 0
    },
    {
      nom: 'Magistrature',
      type: 'professionnel',
      description: 'Formation spécialisée pour les concours de la magistrature',
      prix: 20000,
      is_active: true,
      question_count: 0
    }
  ]

  const results = []

  for (const category of newCategories) {
    const { data: existing } = await supabaseAdmin
      .from('categories')
      .select('id, nom')
      .eq('nom', category.nom)
      .eq('type', 'professionnel')
      .maybeSingle()

    if (existing) {
      results.push({ nom: category.nom, status: 'exists', id: existing.id })
      continue
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([category])
      .select()

    if (error) {
      results.push({ nom: category.nom, status: 'error', message: error.message })
    } else {
      results.push({ nom: category.nom, status: 'success', id: data[0].id })
    }
  }

  const { data: allCategories } = await supabaseAdmin
    .from('categories')
    .select('id, nom, type, prix')
    .eq('type', 'professionnel')
    .order('created_at', { ascending: true })

  return new Response(JSON.stringify({
    success: true,
    results,
    total_professional_categories: allCategories?.length || 0,
    categories: allCategories
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
