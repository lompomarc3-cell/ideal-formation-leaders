import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// ================================================
// STRUCTURE DES TABLES SUPABASE (Structure réelle)
// ================================================
//
// TABLE: profiles
//   id (UUID), full_name (TEXT), phone (TEXT unique),
//   role (TEXT: 'user'|'superadmin'),
//   subscription_status (TEXT: 'free'|'active'),
//   subscription_type (TEXT: 'direct'|'professionnel'|'all'),
//   subscription_expires_at (TIMESTAMPTZ),
//   created_at (TIMESTAMPTZ)
//   NOTE: password_hash stocké dans correction_requests (status='auth')
//
// TABLE: categories
//   id (UUID), nom (TEXT), type (TEXT: 'direct'|'professionnel'),
//   description (TEXT), prix (INT), question_count (INT),
//   is_active (BOOL), created_at
//
// TABLE: questions
//   id (UUID), category_id (UUID→categories.id),
//   enonce (TEXT), option_a/b/c/d (TEXT),
//   reponse_correcte (CHAR: A|B|C|D),
//   explication (TEXT), is_demo (BOOL), is_active (BOOL), created_at
//
// TABLE: user_progress
//   id, user_id, question_id, is_correct, created_at
//
// TABLE: correction_requests (multi-usage)
//   id, user_id, question_id (nullable),
//   message (TEXT - JSON pour paiements/auth),
//   status (TEXT: 'pending'|'approved'|'rejected'|'auth'),
//   admin_response (TEXT), created_at
//
// HELPER FUNCTIONS:
//   getUserFromToken(token) → profile object
//   isAdminUser(profile) → boolean
