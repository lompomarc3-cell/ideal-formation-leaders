export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'

/**
 * 🚨 PHASE 2 — API PUBLIQUE pour récupérer les prix avec promotions actives.
 * Format attendu par le composant PromoPrice :
 *   { prices: { direct: { prix, prix_promo, has_promo, date_fin, label },
 *               professionnel: { prix, prix_promo, has_promo, date_fin, label } } }
 *
 * Source des promotions : table `correction_requests` avec marqueur ifl_promo
 * (cohérent avec l'architecture existante du projet).
 */

function isPromoActive(parsed) {
  if (!parsed || parsed.type !== 'ifl_promo') return false
  if (parsed.is_active === false) return false
  const now = new Date()
  const debut = parsed.date_debut ? new Date(parsed.date_debut) : null
  const fin = parsed.date_fin ? new Date(parsed.date_fin) : null
  if (debut && now < debut) return false
  if (fin && now > fin) return false
  return true
}

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    // 1. Prix normaux (depuis categories)
    const { data: cats } = await supabaseAdmin
      .from('categories')
      .select('type, prix')
      .eq('is_active', true)

    let directPrix = 5000
    let profPrix = 20000
    if (cats) {
      for (const c of cats) {
        if (c.type === 'direct' && c.prix) directPrix = c.prix
        if (c.type === 'professionnel' && c.prix) profPrix = c.prix
      }
    }

    // 2. Promotions actives
    const { data: promoRows } = await supabaseAdmin
      .from('correction_requests')
      .select('id, message, status, created_at')
      .eq('status', 'approved')
      .like('message', '%ifl_promo%')
      .order('created_at', { ascending: false })
      .limit(50)

    const promosByType = { direct: null, professionnel: null }
    if (promoRows) {
      for (const row of promoRows) {
        try {
          const parsed = JSON.parse(row.message || '{}')
          if (!isPromoActive(parsed)) continue
          if (!promosByType[parsed.type_concours]) {
            promosByType[parsed.type_concours] = {
              prix_promo: parsed.prix_promo,
              date_fin: parsed.date_fin,
              label: parsed.label || null
            }
          }
        } catch {}
      }
    }

    const buildEntry = (type, prix_normal) => {
      const promo = promosByType[type]
      return {
        prix: prix_normal,
        prix_promo: promo ? promo.prix_promo : null,
        has_promo: !!promo,
        date_fin: promo ? promo.date_fin : null,
        label: promo ? promo.label : null
      }
    }

    return new Response(JSON.stringify({
      prices: {
        direct: buildEntry('direct', directPrix),
        professionnel: buildEntry('professionnel', profPrix)
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30'
      }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
