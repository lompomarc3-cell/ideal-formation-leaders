// Client Supabase PUBLIC. This key is publishable by design; RLS controls access.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cyasoaihjjochwhnhwqf.supabase.co'
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_57eoYBC7LjaYpj53k5Yn5g_OWVLDefZ'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
