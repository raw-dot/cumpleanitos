# 🗑️ Setup Hard Delete - Vercel Edge Function

## Problema Resuelto
Antes: Soft delete dejaba datos inconsistentes al re-registrarse
Ahora: Hard delete completo vía Vercel Edge Function con service_role

---

## 📋 Pasos para Activar

### 1. Agregar Variables de Entorno en Vercel

Ir a: https://vercel.com/raw-dot/cumpleanitos/settings/environment-variables

Agregar estas 3 variables:

**NEXT_PUBLIC_SUPABASE_URL**
```
https://bbhmbnhbzhbyktztdrhu.supabase.co
```

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiaG1ibmhiemhieWt0enRkcmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mjg3OTgsImV4cCI6MjA4ODQwNDc5OH0.YBsWLLkXdQELXpz-S0tMmVzOKqbj7OunXRBjNP_0RdA
```

**SUPABASE_SERVICE_ROLE_KEY** ⚠️ PRIVADA
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiaG1ibmhiemhieWt0enRkcmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgyODc5OCwiZXhwIjoyMDg4NDA0Nzk4fQ.P4aRPrpFEqf1cBre4BlAUPgFzxjYlLfiSp613awDLC8
```

### 2. Re-deploy en Vercel

Las variables de entorno requieren re-deploy para aplicarse.

Opción A: Push cualquier cambio → auto-deploy
Opción B: Manual en Vercel Dashboard → Deployments → Redeploy

---

## ✅ Cómo Funciona

1. Usuario click "Eliminar cuenta" en /configuracion
2. Frontend llama POST /api/delete-user con userId
3. Edge Function valida token del usuario
4. Borra en orden:
   - gift_items de las campañas
   - contributions
   - gift_campaigns
   - friends
   - profiles
   - **auth.users** (hard delete con service_role)
5. Usuario queda completamente eliminado de BD
6. Re-registro empieza 100% desde cero

---

## 🔒 Seguridad

- Endpoint valida que el token del usuario coincida con userId
- Service role key solo accesible en backend (Vercel)
- No se puede llamar desde navegador directamente

---

## 🧪 Testing

1. Crear usuario de prueba
2. Eliminar cuenta
3. Verificar en Supabase que desapareció de auth.users
4. Re-registrar con mismo email
5. Debería crear usuario nuevo (UUID diferente)

