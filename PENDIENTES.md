# 📋 Pendientes cumpleanitos.com

## 🔴 Alta Prioridad

### 1. Eliminar cuenta - Hard Delete completo
**Problema:** Al eliminar y re-registrar, sigue recordando datos antiguos.

**Status actual (v0.13.2):**
- ✅ Soft delete implementado (marca deleted_at)
- ✅ Onboarding detecta usuarios eliminados
- ❌ Al completar onboarding, NO resetea todos los campos
- ❌ Persisten: username viejo, campañas viejas, etc.

**Solución pendiente:**
- Opción A: Hard delete real via backend/edge function (requiere service_role)
- Opción B: Reset completo de TODOS los campos en onboarding cuando `deleted_at !== null`
  ```javascript
  // En GoogleOnboardingModal.jsx línea 55
  const { error: err } = await supabase.from("profiles").update({
    username: username.trim(),
    phone: phone.trim(),
    birthday,
    age,
    days_to_birthday,
    name,
    deleted_at: null,
    is_active: true,
    avatar_url: null,           // ← AGREGAR
    payment_alias: null,        // ← AGREGAR
    // Resetear TODOS los campos custom
  }).eq("id", user.id);
  
  // También borrar gift_campaigns viejas
  await supabase.from("gift_campaigns")
    .delete()
    .eq("birthday_person_id", user.id)
    .not("deleted_at", "is", null);
  ```

**Prioridad:** Media-Alta
**Estimación:** 30 min

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
