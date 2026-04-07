import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,      // refresca el token antes de que expire
    persistSession: true,        // guarda la sesión en localStorage
    detectSessionInUrl: true,    // detecta tokens en la URL (OAuth)
    storageKey: 'cumpleanitos-auth', // clave única para evitar conflictos
  },
  global: {
    headers: {
      'x-app-version': '0.12',
    },
  },
})
