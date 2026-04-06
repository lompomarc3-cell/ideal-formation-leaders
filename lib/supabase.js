import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// ========================
// MAPPING DE LA STRUCTURE RÉELLE SUPABASE
// ========================
// TABLE: profiles
//   id (UUID), full_name, phone (unique), province_id, exam_category_id,
//   avatar_url, role (user|superadmin), subscription_status (free|active),
//   subscription_expires_at, subscription_type (direct|professionnel|all), created_at
//   + colonnes custom: password_hash (TEXT), nom (TEXT), prenom (TEXT)
//   Note: password_hash/nom/prenom sont stockés dans correction_requests.admin_response
//         ou on les ajoute directement via l'API si elles existent
//
// TABLE: categories
//   id (UUID), nom, type (direct|professionnel), description, prix (INT),
//   question_count (INT), is_active (BOOLEAN), created_at
//
// TABLE: questions
//   id (UUID), category_id (UUID→categories.id), enonce (TEXT),
//   option_a/b/c/d (TEXT), reponse_correcte (CHAR A|B|C|D),
//   explication (TEXT), annee, matiere, difficulte, is_demo (BOOLEAN),
//   is_active (BOOLEAN), created_at
//
// TABLE: user_progress
//   id (UUID), user_id (UUID→profiles.id), question_id (UUID→questions.id),
//   ... (autres colonnes à confirmer)
//
// TABLE: correction_requests  (RÉUTILISÉE POUR PAIEMENTS)
//   id (UUID), user_id (UUID→profiles.id), question_id (NULL pour paiements),
//   message (TEXT - JSON encodé pour paiements), status (pending|approved|rejected),
//   admin_response (TEXT - utilisé pour stocker password_hash des users),
//   created_at
//
// RPC disponibles:
//   get_user_role(user_id UUID) → TEXT (user|superadmin)
