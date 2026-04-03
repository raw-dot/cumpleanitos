# 📋 Pendientes cumpleanitos.com

## 🔴 Alta Prioridad - CRÍTICO

### 1. Eliminar cuenta - Hard Delete NO FUNCIONA
**Problema:** Al eliminar y re-registrar, sigue recordando datos antiguos.

**Intentos fallidos (v0.13 - v0.14.1):**
- ❌ Soft delete con deleted_at (marca pero no borra)
- ❌ admin.deleteUser() desde frontend (sin service_role)
- ❌ Vercel Edge Function /api/delete-user (no funciona en Vite SPA)
- ❌ SQL Trigger on profile delete (no se ejecutó o falló)

**Root cause:**
- `auth.users` requiere service_role para DELETE
- Frontend solo tiene anon key
- Triggers en profiles no tienen permisos sobre auth.users

**Soluciones pendientes a probar:**
1. **Supabase Edge Function** (nativo, tiene service_role)
   - Crear función en Supabase Dashboard
   - Llamarla desde frontend
   - Puede borrar auth.users
   
2. **RPC Function con SECURITY DEFINER**
   ```sql
   CREATE OR REPLACE FUNCTION hard_delete_user(user_id UUID)
   RETURNS void AS $$
   BEGIN
     -- Borrar datos relacionados
     DELETE FROM gift_items WHERE campaign_id IN (
       SELECT id FROM gift_campaigns WHERE birthday_person_id = user_id
     );
     DELETE FROM contributions WHERE campaign_id IN (
       SELECT id FROM gift_campaigns WHERE birthday_person_id = user_id
     );
     DELETE FROM gift_campaigns WHERE birthday_person_id = user_id;
     DELETE FROM friends WHERE user_id = user_id OR friend_id = user_id;
     DELETE FROM profiles WHERE id = user_id;
     DELETE FROM auth.users WHERE id = user_id;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```
   Llamar desde frontend: `supabase.rpc('hard_delete_user', { user_id })`

3. **Workaround temporal:** Dejar soft delete y limpiar manualmente desde Supabase Dashboard

**Prioridad:** CRÍTICA (múltiples bugs reportados)
**Estimación:** 1-2 hrs debugging + implementación

---

## 🟡 Media Prioridad

### 2. Automatizar ejecución de SQLs
**Problema:** Sandbox bloquea conexiones → no puedo ejecutar migrations automáticamente.

**Soluciones documentadas:** `DESBLOQUEAR_RED_OPCIONES.md`
- Opción 1 (recomendada): GitHub Actions con secret
- Opción 2: Vercel Edge Function `/api/execute-sql`

**Prioridad:** Media
**Estimación:** 20 min setup inicial

---

### 3. Admin - "Papelera" para usuarios eliminados
**Feature:** Pantalla admin para ver/restaurar/borrar usuarios con `deleted_at !== null`.

**UI:**
- Tabla filtrada por `deleted_at IS NOT NULL`
- Botón "Restaurar" (pone deleted_at = null, is_active = true)
- Botón "Borrar permanente" (hard delete via backend)
- Auto-cleanup después de 30 días

**Prioridad:** Baja
**Estimación:** 1-2 hrs

---

## 🟢 Baja Prioridad

### 4. Optimizar bundle size
**Problema:** Warning en build: chunks > 500 KB
**Solución:** Code splitting con dynamic imports

---

## ✅ Completado

- ✅ v0.11: Google OAuth fix (triggers rotos)
- ✅ v0.12: Selector de cuentas Google forzado
- ✅ v0.13: Soft delete implementado
- ✅ Documentación flujo OAuth mejorado
- ✅ Mockup interactivo OAuth
