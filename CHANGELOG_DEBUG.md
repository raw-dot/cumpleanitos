# 🔍 Changelog Debug - Google OAuth roto desde 1 abril 2026 ~19:00hs

## ✅ FUNCIONABA hasta: 1 abril 18:55hs (commit 84cbebb)

---

## 📋 Commits posteriores (orden cronológico):

### 1. **2da6893** - feat: email como campo core (SOSPECHOSO ⚠️)
- **Qué hizo:** Agregó columna `email` a tabla `profiles`
- **SQL ejecutado:** `migration-email-core.sql`
- **CRÍTICO:** Creó trigger `sync_email_on_signup()` que hace UPDATE pero NO INSERT
- **Efecto:** Reemplazó trigger anterior que SÍ creaba profiles
- **Archivo:** `migrations/migration-email-core.sql`

### 2. **66d9e96** - fix: admin solo edita email de contacto
- **Qué hizo:** Cambios en AdminPage.jsx
- **Archivos:** `src/pages/AdminPage.jsx`
- **Efecto:** Solo frontend, no afecta OAuth

### 3. **61dd5b6** - debug: agregar logs para diagnosticar emails
- **Qué hizo:** Debugging en AdminPage
- **Efecto:** Solo logs, no afecta OAuth

### 4. **3d7d821** - revert: volver AdminPage al estado anterior
- **Qué hizo:** Revertir AdminPage
- **Efecto:** Solo frontend

### 5. **ca06836** - fix: volver a usar select directo
- **Qué hizo:** Cambios en consultas de AdminPage
- **Efecto:** Solo frontend

### 6. **c1fac9e** - feat: FASE 1 completa - eliminar, acciones
- **Qué hizo:** Features de admin
- **Efecto:** Solo frontend

### 7. **a2ff6c2** - fix: cerrar modal antes de alert
- **Qué hizo:** Fix UI en deleteUser
- **Efecto:** Solo frontend

### 8. **84cbebb** - feat: Papelera de reciclaje (ÚLTIMO QUE FUNCIONABA ✅)
- **Timestamp:** Antes de 18:55hs
- **Estado:** Google OAuth funcionando

---

### 9. **b9edcea** - fix(auth): registro en 2 pasos (ROMPIÓ TODO 💥)
- **Timestamp:** 22:49:44 (1 abril)
- **Qué hizo:** Cambió AuthPage a 2 pasos (email+pass → datos personales)
- **Archivos:** `src/pages/AuthPage.jsx`
- **Efecto:** Cambió UI pero NO tocó handleGoogle()
- **Estado:** Google OAuth empezó a fallar con "Database error saving new user"

### 10. **4857188** - feat(settings): eliminar cuenta
- **Qué hizo:** Agregó opción de eliminar cuenta en settings
- **Efecto:** No relacionado con OAuth

---

## 🔧 Intentos de fix (todos fallidos):

### 11. **0f4d111** - fix(auth): CompleteProfilePage
- **Qué hizo:** Creó CompleteProfilePage para completar perfil después de Google
- **Archivos:** `src/pages/CompleteProfilePage.jsx`, `src/App.jsx`
- **Efecto:** NO ARREGLÓ - sigue fallando en crear usuario

### 12. **05dce81** - feat(migrations): versionado de SQLs
- **Qué hizo:** Movió SQLs a carpeta `/migrations`
- **Efecto:** Solo organización

### 13. **7b086bf** - feat(ci): GitHub Action
- **Qué hizo:** Creó workflow para ejecutar migrations
- **Efecto:** Infraestructura

### 14. **8f242fe** - fix(ci): corregir sintaxis ES modules
- **Qué hizo:** Fix del GitHub Action
- **Efecto:** Infraestructura

### 15. **f362f1b** - feat(diagnostics): script diagnóstico
- **Qué hizo:** SQL para diagnosticar
- **Efecto:** Debugging

### 16. **5b25cff** - fix: trigger simplificado (INTENTO 1)
- **SQL:** `2026-04-02_fix-google-oauth-trigger.sql`
- **Qué hace:** Trigger con lógica compleja de username
- **Estado:** ❌ FALLÓ

### 17. **3026950** - fix: campos obligatorios (INTENTO 2)
- **SQL:** `2026-04-02_fix-google-oauth-v2.sql`
- **Qué hace:** Trigger minimalista
- **Estado:** ❌ FALLÓ

### 18. **6926b9e** - fix: bypass RLS (INTENTO 3)
- **SQL:** `2026-04-02_fix-google-oauth-v3-final.sql`
- **Qué hace:** Incluye name y birthday
- **Estado:** ❌ FALLÓ
- **SQL:** `2026-04-02_fix-google-oauth-v4-bypass-rls.sql`
- **Qué hace:** Bypass RLS con SET LOCAL role
- **Estado:** ❌ FALLÓ

---

## 🎯 CAUSA RAÍZ IDENTIFICADA:

**Commit 2da6893** ejecutó `migration-email-core.sql` que:
1. Hizo `DROP TRIGGER on_auth_user_created`
2. Creó nuevo trigger con función `sync_email_on_signup()`
3. **Problema:** La nueva función hace UPDATE pero NO INSERT

**Consecuencia:** Cuando alguien se registra con Google:
- Supabase Auth intenta crear usuario en `auth.users`
- El trigger `on_auth_user_created` se dispara
- La función `sync_email_on_signup()` intenta UPDATE en profile que NO EXISTE
- El UPDATE falla silenciosamente (0 rows affected)
- Pero algo más está fallando que causa "Database error saving new user"

---

## ❓ PROBLEMA ACTUAL (no resuelto):

El error "Database error saving new user" sugiere que:
- **NO es el trigger** (los intentos 1-4 fallaron)
- **NO es RLS** (bypass RLS falló)
- **Posiblemente:** Configuración de Google OAuth cambió
- **O:** Hay OTRO trigger en auth.users que está fallando

---

## 📊 Mapeo Commits vs Deploys:

| Commit | Timestamp | Vercel Deploy | Estado OAuth |
|--------|-----------|---------------|--------------|
| 84cbebb | 1-abr pre-18:55 | ? | ✅ Funcionando |
| b9edcea | 1-abr 22:49 | ? | ❌ Roto |
| 0f4d111 | 2-abr | build-??? | ❌ Roto |
| 5b25cff | 2-abr | build-??? | ❌ Roto |
| 3026950 | 2-abr | build-??? | ❌ Roto |
| 6926b9e | 2-abr | build-??? | ❌ Roto |

