// Server-only Supabase clients. Secrets are supplied by Cloudflare Pages runtime variables.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://cyasoaihjjochwhnhwqf.supabase.co'
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'missing-publishable-key'
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-secret-key'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})
