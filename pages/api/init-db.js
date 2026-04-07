export const runtime = 'edge'

// Endpoint désactivé en production - utiliser le SQL direct dans Supabase Dashboard
export default async function handler(req, res) {
  return res.status(404).json({ error: 'Endpoint désactivé en production. Utilisez le SQL Editor Supabase.' })
}
