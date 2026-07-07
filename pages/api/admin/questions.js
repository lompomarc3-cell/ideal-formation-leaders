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

  const url = new URL(req.url)

  // GET: lister les questions (avec recherche Full-Text et pagination)
  if (req.method === 'GET') {
    try {
      const categorieId = url.searchParams.get('categorie_id')
      const searchQ = (url.searchParams.get('search') || '').trim()
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const perPage = parseInt(url.searchParams.get('per_page') || '0', 10) // 0 = tout retourner

      const SELECT_COLS = 'id, enonce, option_a, option_b, option_c, option_d, reponse_correcte, explication, is_demo, is_active, category_id, annee, categories(nom, type)'

      // Construit une requête de base (réutilisable pour chaque tranche de pagination)
      const buildQuery = () => {
        let q = supabaseAdmin
          .from('questions')
          .select(SELECT_COLS, { count: 'exact' })
          // 🆕 v3.0.11: Tri par annee (display_order) quand défini, sinon created_at
          // annee = null → trier en dernier (nulls last) puis par created_at
          .order('annee', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true })
          .order('id', { ascending: true }) // tri tertiaire stable

        // Filtre par catégorie
        if (categorieId) q = q.eq('category_id', categorieId)

        // Recherche Full-Text : sur énoncé, options, explication
        if (searchQ) {
          const like = `%${searchQ}%`
          q = q.or(
            `enonce.ilike.${like},option_a.ilike.${like},option_b.ilike.${like},option_c.ilike.${like},option_d.ilike.${like},explication.ilike.${like}`
          )
        }
        return q
      }

      let questions = []
      let count = 0
      let error = null

      if (perPage > 0) {
        // Pagination explicite demandée par le client
        const offset = (page - 1) * perPage
        const res = await buildQuery().range(offset, offset + perPage - 1)
        error = res.error
        questions = res.data || []
        count = res.count || 0
      } else {
        // ✅ AUCUNE LIMITE : on récupère TOUTES les questions du dossier.
        // PostgREST/Supabase plafonne chaque requête à max-rows (souvent 1000),
        // même avec un .range() large. On boucle donc par tranches jusqu'à
        // épuisement pour garantir que 100 % des questions sont chargées.
        const CHUNK = 1000
        let from = 0
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const res = await buildQuery().range(from, from + CHUNK - 1)
          if (res.error) { error = res.error; break }
          const batch = res.data || []
          questions = questions.concat(batch)
          if (typeof res.count === 'number') count = res.count
          if (batch.length < CHUNK) break // dernière tranche atteinte
          from += CHUNK
          // Filet de sécurité pour éviter toute boucle infinie
          if (from > 200000) break
        }
        // Fallback : si le total connu dépasse ce qui a été chargé, on log sans bloquer
        if (count > questions.length) {
          count = Math.max(count, questions.length)
        } else {
          count = questions.length
        }
      }

      if (error) throw error

      return new Response(JSON.stringify({
        questions: (questions || []).map(q => ({
          id: q.id,
          category_id: q.category_id,
          categorie_nom: q.categories?.nom || '',
          categorie_type: q.categories?.type || '',
          question_text: q.enonce,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          bonne_reponse: q.reponse_correcte,
          explication: q.explication,
          is_demo: q.is_demo,
          display_order: q.annee  // 🆕 v3.0.11: champ annee utilisé comme display_order
        })),
        total: count || 0
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // POST: ajouter une question (ou bulk: plusieurs questions en une fois)
  if (req.method === 'POST') {
    let body = {}
    try { body = await req.json() } catch {}

    // 🚀 MODE BULK : remplace l'ancien call client-side qui exposait la SERVICE_KEY
    if (body.bulk === true && Array.isArray(body.questions)) {
      const incoming = body.questions
      if (incoming.length === 0) {
        return new Response(JSON.stringify({ error: 'Aucune question à insérer' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      // Toutes les questions doivent cibler la même catégorie
      const category_id = incoming[0].category_id
      if (!category_id) {
        return new Response(JSON.stringify({ error: 'category_id manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      // Récupérer la catégorie pour matiere
      const { data: cat } = await supabaseAdmin.from('categories').select('id, nom').eq('id', category_id).maybeSingle()
      const matiere = cat?.nom || 'QCM'

      try {
        // Détection des doublons par énoncé (lowercased) déjà actifs dans la catégorie
        const { data: existing } = await supabaseAdmin
          .from('questions')
          .select('enonce')
          .eq('category_id', category_id)
          .eq('is_active', true)
        const existingSet = new Set((existing || []).map(r => (r.enonce || '').trim().toLowerCase()))

        const filtered = incoming.filter(q => {
          const enonce = (q.question_text || q.enonce || '').trim()
          if (!enonce) return false
          if (existingSet.has(enonce.toLowerCase())) return false
          existingSet.add(enonce.toLowerCase()) // évite doublons internes au batch aussi
          return true
        })
        const skipped = incoming.length - filtered.length

        if (filtered.length === 0) {
          return new Response(JSON.stringify({ success: true, inserted: 0, skipped, message: 'Aucune nouvelle question à insérer (toutes déjà présentes)' }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
          })
        }

        const rows = filtered.map(q => ({
          category_id,
          enonce: (q.question_text || q.enonce || '').trim(),
          option_a: q.option_a || '',
          option_b: q.option_b || '',
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          reponse_correcte: q.bonne_reponse || q.reponse_correcte || 'A',
          explication: q.explication || '',
          matiere,
          difficulte: 'moyen',
          is_demo: !!q.is_demo,
          is_active: true
        }))

        const { error: insertError } = await supabaseAdmin.from('questions').insert(rows)
        if (insertError) throw insertError

        // Recalculer le compteur réel
        const { count: realCount } = await supabaseAdmin
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', category_id)
          .eq('is_active', true)
        await supabaseAdmin.from('categories').update({ question_count: realCount || 0 }).eq('id', category_id)

        return new Response(JSON.stringify({ success: true, inserted: rows.length, skipped, total_active: realCount }), {
          status: 201, headers: { 'Content-Type': 'application/json' }
        })
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      }
    }

    // Mode unitaire (1 question)
    const { category_id, question_text, option_a, option_b, option_c, option_d, bonne_reponse, explication } = body

    if (!category_id || !question_text || !option_a || !option_b || !option_c || !option_d || !bonne_reponse) {
      return new Response(JSON.stringify({ error: 'Tous les champs sont requis' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const { data: q, error } = await supabaseAdmin
        .from('questions')
        .insert({
          category_id,
          enonce: question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          reponse_correcte: bonne_reponse,
          explication: explication || '',
          matiere: 'QCM',
          difficulte: 'moyen',
          is_demo: false,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      // Recalculer le compteur sur la base du nombre RÉEL de questions actives
      // (évite toute désynchronisation après soft-delete / réinsertion)
      const { count: realCount } = await supabaseAdmin
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', category_id)
        .eq('is_active', true)

      await supabaseAdmin
        .from('categories')
        .update({ question_count: realCount || 0 })
        .eq('id', category_id)

      return new Response(JSON.stringify({ success: true, question: q }), {
        status: 201, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // PUT: modifier une question
  if (req.method === 'PUT') {
    let body = {}
    try { body = await req.json() } catch {}
    const { id, question_text, option_a, option_b, option_c, option_d, bonne_reponse, explication } = body

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const updates = {}
      if (question_text) updates.enonce = question_text
      if (option_a) updates.option_a = option_a
      if (option_b) updates.option_b = option_b
      if (option_c) updates.option_c = option_c
      if (option_d) updates.option_d = option_d
      if (bonne_reponse) updates.reponse_correcte = bonne_reponse
      if (explication !== undefined) updates.explication = explication

      const { data: q, error } = await supabaseAdmin
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ success: true, question: q }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // DELETE: supprimer (soft delete)
  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id')
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      // Récupérer la category_id avant désactivation
      const { data: q } = await supabaseAdmin
        .from('questions')
        .select('category_id')
        .eq('id', id)
        .single()

      const { error } = await supabaseAdmin
        .from('questions')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      // Resynchroniser le question_count de la catégorie
      if (q && q.category_id) {
        const { count: realCount } = await supabaseAdmin
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', q.category_id)
          .eq('is_active', true)

        await supabaseAdmin
          .from('categories')
          .update({ question_count: realCount || 0 })
          .eq('id', q.category_id)
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
}
