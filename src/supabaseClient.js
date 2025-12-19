import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_url_here' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here'

if (!isConfigured) {
  console.error('Supabase Environment Variables are missing or invalid. Please check your .env file.')
}

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

