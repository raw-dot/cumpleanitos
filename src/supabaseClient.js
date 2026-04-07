import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bbhmbnhbzhbyktztdrhu.supabase.co'
const supabaseAnonKey = 'sb_publishable_KpZa0NPLvrb0y8aVC1hzZQ_GGLIhh0B'

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
