import { supabaseAdmin } from '../../../lib/supabase'
import bcrypt from 'bcryptjs'

let initialized = false

// Cette fonction s'exécute lors du premier appel à n'importe quelle route
export async function ensureTablesExist() {
  if (initialized) return true
  
  // Vérifier si les tables existent
  const { error: checkError } = await supabaseAdmin
    .from('ifl_users')
    .select('id')
    .limit(1)
  
  if (!checkError) {
    initialized = true
    return true
  }
  
  // Tables n'existent pas - on ne peut pas les créer via REST API
  // Retourner false pour que l'app affiche un message d'erreur
  return false
}

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  // Vérifier que les tables existent  
  const { error: checkError } = await supabaseAdmin
    .from('ifl_users')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (checkError && checkError.code === 'PGRST205') {
    return res.status(503).json({
      error: 'database_not_initialized',
      message: 'Les tables de base de données doivent être créées.',
      sqlRequired: true
    })
  }

  return res.json({ status: 'ok', initialized: true })
}
