export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'

// ============================================================
// Ordre officiel des dossiers Concours Directs (12 dossiers)
// ============================================================
const DIRECT_ORDER = [
  "actualit",        // 1 - Actualité / Culture générale
  "fran",            // 2 - Français
  "litt",            // 3 - Littérature et Art
  "h-g",             // 4 - H-G (Histoire-Géographie)
  "histoir",         // 4 - variante Histoire
  "svt",             // 5 - SVT
  "psycho",          // 6 - Psychotechniques
  "math",            // 7 - Maths
  "physique",        // 8 - Physique-Chimie
  "pc (",            // 8 - variante PC
  "droit",           // 9 - Droit
  "conomie",         // 10 - Économie
  "entra",           // 11 - Entraînement QCM
  "accomp",          // 12 - Accompagnement Final
]

// ============================================================
// Ordre officiel des dossiers Concours Professionnels (17 dossiers)
// ============================================================
const PRO_ORDER = [
  "vie scolaire",    // 1 - Spécialités Vie scolaire (CASU-AASU)
  "casu",            // 1 - variante
  "actualit",        // 2 - Actualités et culture générale
  "cisu",            // 3 - Spécialités CISU/AISU/ENAREF
  "ies",             // 4 - Inspectorat : IES
  "iepenf",          // 5 - Inspectorat : IEPENF
  "csap",            // 6 - CSAPÉ
  "agr",             // 7 - Agrégés
  "capes",           // 8 - CAPES toutes options
  "pital",           // 9 - Administrateur des hôpitaux
  "sant",            // 10 - Spécialités santé
  "justice",         // 11 - Justice
  "magistr",         // 12 - Magistrature
  "gsp",             // 13 - Spécialités GSP
  "police",          // 14 - Spécialités police
  "civil",           // 15 - Administrateur civil
  "entra",           // 16 - Entraînement QCM
  "accomp",          // 17 - Accompagnement final
]

function getCatOrdre(nom, catType) {
  const n = (nom || '').toLowerCase()
  const orderList = catType === 'direct' ? DIRECT_ORDER : PRO_ORDER

  // Chercher la première correspondance dans la liste ordonnée
  for (let i = 0; i < orderList.length; i++) {
    if (n.includes(orderList[i].toLowerCase())) {
      // Calculer l'ordre réel en tenant compte des doublons (plusieurs clés → même ordre)
      // Pour 'direct': indices 0-1=ordre1, 2=2, 3-4=4, etc.
      if (catType === 'direct') {
        const directMap = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 8, 10: 9, 11: 10, 12: 11, 13: 12 }
        return directMap[i] || (i + 1)
      } else {
        const proMap = { 0: 1, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17 }
        return proMap[i] || (i + 1)
      }
    }
  }
  return 99
}

function getCatIcon(nom, catType) {
  const n = (nom || '').toLowerCase()
  if (n.includes('culture') || n.includes('actualit')) return '🌍'
  if (n.includes('français') || n.includes('franc')) return '📚'
  if (n.includes('littérature') || n.includes('art')) return '🎨'
  if (n.includes('histoire') || n.includes('géographie') || n.includes('h-g')) return '🗺️'
  if (n.includes('svt') || n.includes('science')) return '🧬'
  if (n.includes('psycho')) return '🧠'
  if (n.includes('math')) return '📐'
  if (n.includes('physique') || n.includes('chimie') || n.includes('pc (')) return '⚗️'
  if (n.includes('droit')) return '⚖️'
  if (n.includes('conomie')) return '💹'
  if (n.includes('qcm') || n.includes('entraîn') || n.includes('entra')) return '✏️'
  if (n.includes('accompagn') || n.includes('final')) return '🎯'
  if (n.includes('vie scolaire') || n.includes('casu')) return '🏫'
  if (n.includes('cisu') || n.includes('enaref')) return '🏛️'
  if (n.includes('iepenf')) return '🔎'
  if (n.includes('inspect') || n.includes('ies')) return '🔍'
  if (n.includes('csap')) return '🎓'
  if (n.includes('agrég') || n.includes('agr')) return '📜'
  if (n.includes('capes')) return '📖'
  if (n.includes('hôpital') || n.includes('hopital') || n.includes('pital')) return '🏥'
  if (n.includes('santé') || n.includes('sant')) return '💊'
  if (n.includes('justice')) return '⚖️'
  if (n.includes('magistr')) return '👨‍⚖️'
  if (n.includes('gsp')) return '🛡️'
  if (n.includes('police')) return '👮'
  if (n.includes('civil') || n.includes('admin')) return '📋'
  return catType === 'direct' ? '📚' : '🎓'
}

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  // Vérifier l'authentification
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token requis' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Token invalide' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')

    let query = supabaseAdmin
      .from('categories')
      .select('id, nom, type, description, question_count, prix, is_active')
      .eq('is_active', true)

    if (type && (type === 'direct' || type === 'professionnel')) {
      query = query.eq('type', type)
    }

    const { data: categories, error } = await query

    if (error) throw error

    // Trier par ordre officiel
    const sorted = (categories || [])
      .map(c => ({
        id: c.id,
        nom: c.nom,
        type: c.type,
        description: c.description,
        question_count: c.question_count || 0,
        prix: c.prix || 0,
        icone: getCatIcon(c.nom, c.type),
        ordre: getCatOrdre(c.nom, c.type)
      }))
      .sort((a, b) => {
        // Trier d'abord par type, puis par ordre
        if (a.type !== b.type) return a.type.localeCompare(b.type)
        return a.ordre - b.ordre
      })

    return new Response(JSON.stringify({
      categories: sorted
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
