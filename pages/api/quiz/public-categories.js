// API PUBLIQUE - Catégories sans authentification
// Permet aux visiteurs non connectés de voir les dossiers
export const runtime = 'edge'
import { parseDescription, isScheduleExpired, isScheduleDisabledByAdmin } from '../../../lib/scheduling'

const SUPABASE_URL = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44'

// Noms des lignes de configuration pour la programmation globale par type
const SCHEDULE_CONFIG = {
  direct: { nom: '__SCHEDULE_DIRECT__', type: 'direct' },
  professionnel: { nom: '__SCHEDULE_PRO__', type: 'professionnel' }
}

async function getTypeGlobalSchedulePublic(type) {
  const cfg = SCHEDULE_CONFIG[type]
  if (!cfg) return null
  const url = `${SUPABASE_URL}/rest/v1/categories?nom=eq.${encodeURIComponent(cfg.nom)}&type=eq.${cfg.type}&is_active=eq.false&select=description`
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data || data.length === 0) return null
  const { schedule } = parseDescription(data[0].description || '')
  return schedule
}

function getCatIcon(nom) {
  const n = (nom || '').toLowerCase()
  if (n.includes('culture') || n.includes('actualit')) return '🌍'
  if (n.includes('français') || n.includes('franc')) return '📚'
  if (n.includes('littérature') || n.includes('art')) return '🎨'
  if (n.includes('histoire') || n.includes('géographie') || n.includes('h-g')) return '🗺️'
  if (n.includes('svt') || n.includes('science')) return '🧬'
  if (n.includes('psycho')) return '🧠'
  if (n.includes('math')) return '📐'
  if (n.includes('physique') || n.includes('chimie') || n.includes('pc (')) return '⚗️'
  if (n.includes('droit') && !n.includes('impôt') && !n.includes('impot') && !n.includes('travail')) return '⚖️'
  if (n.includes('conomie')) return '💹'
  if (n.includes('qcm') || n.includes('entraîn') || n.includes('entra')) return '✏️'
  if (n.includes('accompagn') || n.includes('final')) return '🎯'
  if (n.includes('vie scolaire') || n.includes('casu')) return '🏫'
  if (n.includes('cisu')) return '🏛️'
  if (n.includes('iepenf') || n.includes('iepe')) return '🔎'
  if (n.includes('inspect') || n.includes('ies')) return '🔍'
  if (n.includes('csap')) return '🎓'
  if (n.includes('agrég') || n.includes('agr')) return '📜'
  if (n.includes('capes')) return '📖'
  if (n.includes('hôpital') || n.includes('hopital') || n.includes('pital')) return '🏥'
  if (n.includes('santé') || n.includes('sant')) return '💊'
  if (n.includes('greffier') || n.includes('parquet')) return '⚖️'  // GREFFIER, SECRÉTAIRE DE GREFFIER ET PARQUET
  if (n.includes('justice')) return '⚖️'
  if (n.includes('magistr')) return '👨‍⚖️'
  if (n.includes('gsp')) return '🛡️'
  if (n.includes('police')) return '👮'
  if (n.includes('civil') || n.includes('admin')) return '📋'
  // 🆕 Nouveaux dossiers professionnels
  if (n.includes('capé') || n.includes('cape')) return '🎓'
  if (n.includes('impôt') || n.includes('impot')) return '🔍'
  if (n.includes('enaref')) return '🏛️'
  if (n.includes('travail')) return '📋'
  if (n.includes('élevage') || n.includes('elevage') || n.includes('animale')) return '💊'
  if (n.includes('agriculture') || n.includes('agricult')) return '🌿'
  if (n.includes('étrangère') || n.includes('etrangere') || n.includes('affaires étrangères') || n.includes('affaires etrangeres')) return '🌍'
  if (n.includes('douane')) return '🛡️'
  return '🎓'
}

const ORDRE_MAP = {
  direct: ['actualit','fran','litt','h-g','histoir','svt','psycho','math','physique','pc (','droit','conomie','entra','accomp'],
  professionnel: [
    'casu','vie scolaire',
    'actualit',
    'cisu','aisu',  // CISU/AISU (nouveau nom)
    'inspectorat : ies',' ies',
    'iepenf','iepe',
    'csap','capé','cape',
    'agrég','agr',
    'capes',
    'hôpital','hopital','administrateur des h',
    'sant','elevage','élevage','animale','agriculture','agricult',
    'greffier','parquet',  // GREFFIER, SECRÉTAIRE DE GREFFIER ET PARQUET
    'justice',
    'magistr',
    'gsp',
    'police','douane',
    'impôt','impot','travail','enaref','affaires étrangères','affaires etrangeres','étrangère','etrangere',
    'civil',
    'entra',
    'accomp'
  ]
}

function getCatOrdre(nom, type) {
  const n = (nom || '').toLowerCase()
  const list = ORDRE_MAP[type] || []
  for (let i = 0; i < list.length; i++) {
    if (n.includes(list[i].toLowerCase())) return i + 1
  }
  return 99
}

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')

    let fetchUrl = `${SUPABASE_URL}/rest/v1/categories?is_active=eq.true&select=id,nom,type,description,question_count,prix`
    if (type && (type === 'direct' || type === 'professionnel')) {
      fetchUrl += `&type=eq.${type}`
    }

    const res = await fetch(fetchUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      throw new Error(`Supabase error: ${res.status}`)
    }

    const categories = await res.json()

    const now = new Date()

    // Lire les programmations globales par type (parallèle)
    const [directGlobalSch, proGlobalSch] = await Promise.all([
      getTypeGlobalSchedulePublic('direct'),
      getTypeGlobalSchedulePublic('professionnel')
    ])
    const typeGlobalExpired = {
      direct: isScheduleExpired(directGlobalSch, now),
      professionnel: isScheduleExpired(proGlobalSch, now)
    }
    // 🔒 Désactivation admin (enabled=false + disabled_at) : verrouille aussi les dossiers
    const typeGlobalDisabled = {
      direct: isScheduleDisabledByAdmin(directGlobalSch),
      professionnel: isScheduleDisabledByAdmin(proGlobalSch)
    }

    const sorted = (categories || [])
      .map(c => {
        const { description, schedule } = parseDescription(c.description)
        const expiredIndividual = isScheduleExpired(schedule, now)
        const disabledIndividual = isScheduleDisabledByAdmin(schedule)
        const expiredByType = typeGlobalExpired[c.type] || false
        const disabledByType = typeGlobalDisabled[c.type] || false
        const expired = expiredIndividual || expiredByType
        // 🔒 Verrouillé si expiré OU désactivé par admin (individuel ou global par type)
        const locked = expired || disabledIndividual || disabledByType
        return {
          id: c.id,
          nom: c.nom,
          type: c.type,
          description,
          question_count: c.question_count || 0,
          prix: c.prix || 0,
          icone: getCatIcon(c.nom),
          ordre: getCatOrdre(c.nom, c.type),
          _expired: expired,
          _is_programmed: !!schedule.enabled,
          _date_validite: schedule.date,
          // Si verrouillé (expiré ou désactivé) → seules 5 questions gratuites accessibles
          _limited_to_demo: locked,
          // 🔒 CORRECTION : Pour les visiteurs non connectés (jamais abonnés),
          // on n'affiche PAS le message "Session expirée".
          // is_locked reste false même si programmation expirée.
          // Seul _limited_to_demo=true indique la restriction aux 5 questions gratuites.
          is_locked: false,
          lock_message: null
        }
      })
      // ✅ CORRECTION: Les dossiers restent visibles même expirés.
      // Seul l'accès aux questions au-delà de la 5ème est bloqué (cf. public-questions / questions API).
      .sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type)
        return a.ordre - b.ordre
      })

    return new Response(JSON.stringify({ categories: sorted }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
