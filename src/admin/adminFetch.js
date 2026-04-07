import { supabase } from '../supabaseClient'

/**
 * Ejecuta queries de Supabase con auto-retry si el token expiró.
 * Si la sesión expiró definitivamente, recarga la página para forzar re-login.
 */
export async function withAuthRetry(queryFn) {
  const result = await queryFn()
  
  // Supabase devuelve error con code PGRST301 o message que incluye "JWT" cuando expira
  if (result.error) {
    const msg = result.error?.message || ''
    const isAuthError = 
      result.error?.code === 'PGRST301' ||
      msg.includes('JWT') ||
      msg.includes('invalid claim') ||
      msg.includes('session_not_found') ||
      result.error?.status === 401

    if (isAuthError) {
      // Intentar refrescar el token
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      
      if (!refreshError && data?.session) {
        // Token refrescado — reintentar la query original
        return await queryFn()
      } else {
        // No se pudo refrescar — sesión expirada definitivamente
        console.warn('[Admin] Sesión expirada, redirigiendo...')
        // Dar 1s para que el usuario vea algo
        setTimeout(() => window.location.reload(), 1000)
        return result
      }
    }
  }
  
  return result
}

/**
 * Hook para detectar si el admin está autenticado y refrescar si es necesario.
 * Llámalo en useEffect al montar cada página del admin.
 */
export async function ensureAdminSession() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // Sin sesión — intentar refrescar
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data?.session) {
      return false
    }
  }
  
  return true
}
