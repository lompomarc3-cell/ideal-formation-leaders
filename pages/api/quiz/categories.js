export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth'
import { parseDescription, isScheduleExpired } from '../../../lib/scheduling'

// Lignes de configuration pour la programmation globale par type
const SCHEDULE_CONFIG_NAMES = {
  direct: '__SCHEDULE_DIRECT__',
  professionnel: '__SCHEDULE_PRO__'
}

/**
 * Lit la programmation globale pour un type donné.
 * Retourne le schedule ou null si non configuré.
 */
async function getTypeGlobalSchedule(type) {
  const configName = SCHEDULE_CONFIG_NAMES[type]
  if (!configName) return null
  const { data } = await supabaseAdmin
    .from('categories')
    .select('description')
    .eq('nom', configName)
    .eq('type', type)
    .eq('is_active', false)
    .maybeSingle()
  if (!data) return null
  const { schedule } = parseDescription(data.description || '')
  return schedule
}
// Mapping direct: nom partiel → ordre officiel
const ORDRE_MAP = {
  direct: [
    { match: 'actualit', ordre: 1 },
    { match: 'fran', ordre: 2 },
    { match: 'litt', ordre: 3 },
    { match: 'h-g', ordre: 4 },
    { match: 'histoir', ordre: 4 },
    { match: 'svt', ordre: 5 },
    { match: 'psycho', ordre: 6 },
    { match: 'math', ordre: 7 },
    { match: 'physique', ordre: 8 },
    { match: 'pc (', ordre: 8 },
    { match: 'droit', ordre: 9 },
    { match: 'conomie', ordre: 10 },
    { match: 'entra', ordre: 11 },
    { match: 'accomp', ordre: 12 },
  ],
  professionnel: [
    { match: 'vie scolaire', ordre: 1 },
    { match: 'casu', ordre: 1 },
    { match: 'actualit', ordre: 2 },
    { match: 'cisu', ordre: 3 },
    { match: 'inspectorat : ies', ordre: 4 },
    { match: ' ies', ordre: 4 },
    { match: 'iepenf', ordre: 5 },
    { match: 'csap', ordre: 6 },
    { match: 'agrég', ordre: 7 },
    { match: 'agr', ordre: 7 },
    { match: 'capes', ordre: 8 },
    { match: 'h\u00f4pital', ordre: 9 },
    { match: 'hopital', ordre: 9 },
    { match: 'administrateur des h', ordre: 9 },
    { match: 'sant', ordre: 10 },
    { match: 'justice', ordre: 11 },
    { match: 'magistr', ordre: 12 },
    { match: 'gsp', ordre: 13 },
    { match: 'police', ordre: 14 },
    { match: 'civil', ordre: 15 },
    { match: 'entra', ordre: 16 },
    { match: 'accomp', ordre: 17 },
  ]
}

function getCatOrdre(nom, catType) {
  const n = (nom || '').toLowerCase()
  const mapList = ORDRE_MAP[catType] || []
  // Chercher la correspondance la plus longue en premier (pour éviter les conflits)
  const sorted = [...mapList].sort((a, b) => b.match.length - a.match.length)
  for (const entry of sorted) {
    if (n.includes(entry.match.toLowerCase())) {
      return entry.ordre
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

  // Vérifier l'authentification (optionnelle pour les catégories)
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')

  // Si pas de token, utiliser l'API publique (renvoyer les catégories quand même)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token requis', redirect: '/api/quiz/public-categories' }), {
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

    // Vérifier si l'utilisateur est admin (pour bypasser les programmations)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', payload.userId)
      .maybeSingle()
    const isAdmin = profile && ['admin', 'superadmin'].includes(profile.role)

    let query = supabaseAdmin
      .from('categories')
      .select('id, nom, type, description, question_count, prix, is_active')
      .eq('is_active', true)

    if (type && (type === 'direct' || type === 'professionnel')) {
      query = query.eq('type', type)
    }

    const { data: categories, error } = await query

    if (error) throw error

    const now = new Date()

    // Lire les programmations globales par type (parallèle pour la perf)
    const [directGlobalSch, proGlobalSch] = await Promise.all([
      getTypeGlobalSchedule('direct'),
      getTypeGlobalSchedule('professionnel')
    ])
    const typeGlobalExpired = {
      direct: isScheduleExpired(directGlobalSch, now),
      professionnel: isScheduleExpired(proGlobalSch, now)
    }

    // ✅ CORRECTION programmation : on ne filtre PLUS les catégories expirées.
    // Les dossiers restent visibles. Seules les questions au-delà de la 5ème
    // sont bloquées pour les non-admins (cf. /api/quiz/questions et /api/quiz/public-questions).
    const sorted = (categories || [])
      .map(c => {
        const { description, schedule } = parseDescription(c.description)
        // Expiration individuelle du dossier
        const expiredIndividual = isScheduleExpired(schedule, now)
        // Expiration globale par type (programmation séparée direct/pro)
        const expiredByType = typeGlobalExpired[c.type] || false
        // Un dossier est expiré si sa programmation individuelle OU sa programmation de type global est expirée
        const expired = expiredIndividual || expiredByType
        return {
          id: c.id,
          nom: c.nom,
          type: c.type,
          description, // description propre (sans marqueur)
          question_count: c.question_count || 0,
          prix: c.prix || 0,
          icone: getCatIcon(c.nom, c.type),
          ordre: getCatOrdre(c.nom, c.type),
          _expired: expired,
          _is_programmed: !!schedule.enabled || !!(directGlobalSch?.enabled) || !!(proGlobalSch?.enabled),
          _date_validite: schedule.date,
          // Indicateur pour le front : si non-admin et programmation expirée (individuelle ou par type),
          // l'accès est limité aux 5 premières questions gratuites.
          _limited_to_demo: expired && !isAdmin
        }
      })
      .sort((a, b) => {
        // Trier d'abord par type, puis par ordre
        if (a.type !== b.type) return a.type.localeCompare(b.type)
        return a.ordre - b.ordre
      })

    return new Response(JSON.stringify({
      categories: sorted
    }), { status: 200, headers: { 
      'Content-Type': 'application/json',
      // 🔧 FIX #1 : Pas de cache CDN car la liste peut inclure des informations
      // qui dépendent indirectement du compte (rôle admin pour bypass programmation).
      // On garde un cache navigateur très court pour ne pas dégrader les perfs.
      'Cache-Control': 'private, max-age=10, must-revalidate'
    } })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
