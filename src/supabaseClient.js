import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bbhmbnhbzhbyktztdrhu.supabase.co'
const supabaseAnonKey = 'sb_publishable_KpZa0NPLvrb0y8aVC1hzZQ_GGLIhh0B'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
