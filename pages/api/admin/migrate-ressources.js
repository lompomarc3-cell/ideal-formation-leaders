// Endpoint de migration (admin only) :
// - Vérifie l'existence de la table ressources_pedagogiques
// - Si elle existe, migre les dissertations (matiere='DISSERTATION') depuis la table questions
//
// Si la table n'existe pas, retourne le SQL à exécuter manuellement dans Supabase SQL Editor :
//
// CREATE TABLE IF NOT EXISTS ressources_pedagogiques (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
//   titre TEXT NOT NULL,
//   contenu TEXT NOT NULL,
//   type TEXT DEFAULT 'dissertation',
//   ordre INT DEFAULT 0,
//   is_active BOOLEAN DEFAULT TRUE,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
// ALTER TABLE ressources_pedagogiques ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Authenticated read" ON ressources_pedagogiques FOR SELECT USING (auth.role() = 'authenticated');

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
    return new Response(JSON.stringify({ error: 'Accès refusé' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // 1. Vérifier si la table existe
  const { data: existing, error: checkError } = await supabaseAdmin
    .from('ressources_pedagogiques')
    .select('id', { count: 'exact', head: true })
    .limit(1)

  if (checkError && checkError.message?.includes('schema cache')) {
    return new Response(
      JSON.stringify({
        error: 'Table ressources_pedagogiques inexistante',
        needsCreation: true,
        sql: `CREATE TABLE IF NOT EXISTS ressources_pedagogiques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  type TEXT DEFAULT 'dissertation',
  ordre INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ressources_pedagogiques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON ressources_pedagogiques FOR SELECT USING (true);`
      }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 2. Migrer les dissertations depuis questions (matiere='DISSERTATION')
  const { data: dissertations, error: dissError } = await supabaseAdmin
    .from('questions')
    .select('id, category_id, enonce, explication, created_at')
    .eq('matiere', 'DISSERTATION')
    .eq('is_active', true)

  if (dissError) {
    return new Response(JSON.stringify({ error: dissError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  let migrated = 0
  let skipped = 0

  for (const q of dissertations || []) {
    // Vérifier si déjà migrée
    const { data: already } = await supabaseAdmin
      .from('ressources_pedagogiques')
      .select('id')
      .eq('category_id', q.category_id)
      .eq('titre', q.enonce)
      .maybeSingle()
    if (already) {
      skipped++
      continue
    }
    const { error: insError } = await supabaseAdmin
      .from('ressources_pedagogiques')
      .insert({
        category_id: q.category_id,
        titre: q.enonce,
        contenu: q.explication,
        type: 'dissertation',
        ordre: 1,
        is_active: true
      })
    if (!insError) migrated++
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `${migrated} dissertations migrées, ${skipped} déjà présentes`,
      migrated,
      skipped,
      total: dissertations?.length || 0
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
