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

  // GET: récupérer les prix depuis les catégories + promotions actives
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

      // 🚨 PHASE 2 — Promotions actives (stockées dans correction_requests avec marqueur ifl_promo)
      let directPromo = null
      let profPromo = null
      try {
        const { data: promoRows } = await supabaseAdmin
          .from('correction_requests')
          .select('id, message, status, created_at')
          .eq('status', 'approved')
          .like('message', '%ifl_promo%')
          .order('created_at', { ascending: false })
          .limit(50)

        if (promoRows) {
          const now = new Date()
          for (const row of promoRows) {
            try {
              const p = JSON.parse(row.message || '{}')
              if (p.type !== 'ifl_promo' || p.is_active === false) continue
              const debut = p.date_debut ? new Date(p.date_debut) : null
              const fin = p.date_fin ? new Date(p.date_fin) : null
              if (debut && now < debut) continue
              if (fin && now > fin) continue
              if (p.type_concours === 'direct' && directPromo === null) {
                directPromo = { prix: p.prix_promo, date_fin: p.date_fin, label: p.label || null }
              }
              if (p.type_concours === 'professionnel' && profPromo === null) {
                profPromo = { prix: p.prix_promo, date_fin: p.date_fin, label: p.label || null }
              }
            } catch {}
          }
        }
      } catch {}

      return new Response(JSON.stringify({
        prices: [
          {
            type_concours: 'direct',
            prix: directPrix,
            prix_normal: directPrix,
            prix_promo: directPromo?.prix || null,
            promo_active: !!directPromo,
            promo_date_fin: directPromo?.date_fin || null,
            promo_label: directPromo?.label || null
          },
          {
            type_concours: 'professionnel',
            prix: profPrix,
            prix_normal: profPrix,
            prix_promo: profPromo?.prix || null,
            promo_active: !!profPromo,
            promo_date_fin: profPromo?.date_fin || null,
            promo_label: profPromo?.label || null
          }
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
