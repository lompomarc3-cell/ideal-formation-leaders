// Client Supabase PUBLIC (anon key) - safe pour le navigateur
// Cette clé est PUBLIQUE par design (RLS contrôle l'accès)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
