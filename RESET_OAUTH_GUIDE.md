# 🔄 Reset Completo Google OAuth - Paso a Paso

## Paso 1: Limpiar Supabase Dashboard

### A. Deshabilitar Google Provider temporalmente
1. Ir a: https://supabase.com/dashboard/project/bbhmbnhbzhbyktztdrhu/auth/providers
2. Click en **Google**
3. Toggle OFF (deshabilitar)
4. Save

### B. Verificar Site URL
1. Ir a: https://supabase.com/dashboard/project/bbhmbnhbzhbyktztdrhu/auth/url-configuration
2. **Site URL** debe ser: `https://cumpleanitos.com`
3. **Redirect URLs** debe incluir: `https://cumpleanitos.com/**`

---

## Paso 2: Google Cloud Console - Nueva configuración

### A. Ir a credenciales OAuth
https://console.cloud.google.com/apis/credentials

### B. Editar (o crear nuevo) OAuth 2.0 Client ID
- **Nombre:** Cumpleanitos Production
- **Tipo:** Aplicación web

### C. Authorized redirect URIs - AGREGAR EXACTAMENTE:
```
https://bbhmbnhbzhbyktztdrhu.supabase.co/auth/v1/callback
```

**IMPORTANTE:** 
- NO agregar `https://cumpleanitos.com/...` 
- SOLO el de Supabase
- Copiar exactamente como está arriba

### D. Guardar y copiar:
- Client ID
- Client Secret

---

## Paso 3: Configurar en Supabase

### A. Volver a Google Provider
https://supabase.com/dashboard/project/bbhmbnhbzhbyktztdrhu/auth/providers

### B. Click en Google → Configurar:
1. **Enabled:** ON ✅
2. **Client ID:** [pegar de Google Console]
3. **Client Secret:** [pegar de Google Console]
4. **Redirect URL:** (ya está - NO tocar)
   ```
   https://bbhmbnhbzhbyktztdrhu.supabase.co/auth/v1/callback
   ```
5. **Additional Scopes:** (dejar vacío o default)

### C. Save

---

## Paso 4: Verificar configuración

### A. En Supabase - Authentication → URL Configuration
- Site URL: `https://cumpleanitos.com`
- Redirect URLs: `https://cumpleanitos.com/**`

### B. En Supabase - Authentication → Providers
- Google: ✅ Enabled
- Client ID: empieza con `xxxxx.apps.googleusercontent.com`

---

## Paso 5: Test

### Opción A - Test simple (recomendado)
1. Ir a: https://cumpleanitos.com/test-oauth.html
2. Click "Test Google Login"
3. Ver log de resultados

### Opción B - Test en app real
1. Ir a: https://cumpleanitos.com
2. Click "Registrarse gratis"
3. Click botón Google
4. Ver si funciona

---

## ✅ Checklist final

Antes de probar, verificar:

- [ ] Google Cloud Console: Redirect URI = `https://bbhmbnhbzhbyktztdrhu.supabase.co/auth/v1/callback`
- [ ] Supabase: Site URL = `https://cumpleanitos.com`
- [ ] Supabase: Redirect URLs incluye `https://cumpleanitos.com/**`
- [ ] Supabase: Google Provider habilitado con Client ID/Secret correctos
- [ ] Google Cloud Console: OAuth consent screen configurado (Production o Testing con emails whitelisted)

---

## 🐛 Si sigue fallando

Después del reset, si sigue el error "Error updating user":

**Causa probable:** OAuth consent screen en modo "Testing" y tu email no está en la whitelist.

**Solución:**
1. Google Cloud Console → OAuth consent screen
2. Agregar tu email en "Test users"
3. O publicar la app (Production)

---

## 📝 Notas importantes

- El redirect URI de Supabase es FIJO: `https://[project-ref].supabase.co/auth/v1/callback`
- NO uses `https://cumpleanitos.com` en Google Cloud Console redirects
- Supabase maneja el redirect a cumpleanitos.com internamente usando Site URL
- Si cambias Client ID/Secret, esperar ~1 minuto para que propague

