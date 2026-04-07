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

  // GET: récupérer les prix depuis les catégories
  if (req.method === 'GET') {
    try {
      const { data: cats } = await supabaseAdmin
        .from('categories')
        .select('type, prix')
        .eq('is_active', true)

      // Prix par défaut
      let directPrix = 5000
      let profPrix = 20000

      if (cats) {
        for (const c of cats) {
          if (c.type === 'direct' && c.prix) directPrix = c.prix
          if (c.type === 'professionnel' && c.prix) profPrix = c.prix
        }
      }

      return new Response(JSON.stringify({
        prices: [
          { type_concours: 'direct', prix: directPrix },
          { type_concours: 'professionnel', prix: profPrix }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // PUT: modifier les prix
  if (req.method === 'PUT') {
    let body = {}
    try { body = await req.json() } catch {}
    const { type_concours, prix } = body

    if (!type_concours || !prix) {
      return new Response(JSON.stringify({ error: 'type_concours et prix requis' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const { error } = await supabaseAdmin
        .from('categories')
        .update({ prix: parseInt(prix) })
        .eq('type', type_concours)

      if (error) throw error

      return new Response(JSON.stringify({ success: true, message: `Prix ${type_concours} mis à jour: ${prix} FCFA` }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
}
