// API PUBLIQUE - Catégories sans authentification
// Permet aux visiteurs non connectés de voir les dossiers
export const runtime = 'edge'

const SUPABASE_URL = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44'

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
  return '📋'
}

const ORDRE_MAP = {
  direct: ['actualit','fran','litt','h-g','histoir','svt','psycho','math','physique','pc (','droit','conomie','entra','accomp'],
  professionnel: ['vie scolaire','casu','actualit','cisu','inspectorat : ies',' ies','iepenf','csap','agrég','agr','capes','hôpital','hopital','sant','justice','magistr','gsp','police','civil','entra','accomp']
}

function getCatOrdre(nom, type) {
  const n = (nom || '').toLowerCase()
  const list = ORDRE_MAP[type] || []
  for (let i = 0; i < list.length; i++) {
    if (n.includes(list[i])) return i + 1
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

    const sorted = (categories || [])
      .map(c => ({
        id: c.id,
        nom: c.nom,
        type: c.type,
        description: c.description,
        question_count: c.question_count || 0,
        prix: c.prix || 0,
        icone: getCatIcon(c.nom),
        ordre: getCatOrdre(c.nom, c.type)
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type)
        return a.ordre - b.ordre
      })

    return new Response(JSON.stringify({ categories: sorted }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
