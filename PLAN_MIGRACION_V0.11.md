# 🚀 Plan de Migración v0.11 - Arquitectura Auth Modular

## 📊 Análisis de Impacto - Features Actuales

### ✅ Features que NO se afectan (queries sin email):
- `ExplorePage.jsx` - lista campañas + profiles (username, name, avatar)
- `CelebrantDashboard.jsx` - bio, payment_alias
- `ManagerDashboard.jsx` - perfiles de cumpleañeros
- `NotificationsPage.jsx` - notificaciones
- `FriendsPage.jsx` - amigos
- `SettingsPage.jsx` - avatar, cover, phone, birthday

### ⚠️ Features que SE AFECTAN (usan email):

#### 1. **AdminPage.jsx** (CRÍTICO)
**Queries actuales:**
```javascript
// Línea 442-445
.from("profiles")
.select("*")  // ← incluye email, email_verified
```

**Usos de email:**
- Línea 168-171: Mostrar email en card de usuario
- Línea 237: Modal editar usuario (form.email)
- Línea 246: Reset password via email
- Línea 382: Mostrar email en stats
- Línea 809-813: Mostrar email verificado

**Solución:**
- Cambiar query a `profiles_with_auth` VIEW
- El VIEW ya incluye email desde auth.users

#### 2. **ProfilePage.jsx**
**Usos de email:**
- Línea 27: Fallback name si no existe profile
  ```javascript
  name: currentProfile?.name || currentSession.user.email
  ```
- Línea 139: Nombre del gifter
  ```javascript
  currentProfile?.name || currentSession.user.email
  ```

**Solución:**
- Cambiar a `currentSession.user.user_metadata.full_name || currentSession.user.email`
- El email sigue disponible en `session.user.email`

---

## 🏗️ Estrategia de Migración por Capas

### CAPA 1: Base de Datos (sin tocar frontend)
**Objetivo:** Preparar BD sin romper nada

```sql
-- Step 1: Crear VIEW profiles_with_auth (Migration 3)
-- El VIEW tiene email, email_verified desde auth.users
-- profiles.email TODAVÍA existe (compatibilidad)

-- Step 2: Trigger nuevo que CREA profiles (Migration 4)
-- Sigue sincronizando email a profiles.email (backward compat)

-- Step 3: Soft delete functions (Migration 5)
-- Agregar deleted_at a auth.users
```

**Resultado:** BD preparada, frontend sigue funcionando

---

### CAPA 2: Frontend - Queries (cambios quirúrgicos)

#### Archivo 1: `src/pages/AdminPage.jsx`

**Cambio 1: Query principal**
```javascript
// ANTES (línea 441-445)
const { data: profilesData } = await supabase
  .from("profiles")
  .select("*")
  .is("deleted_at", null)

// DESPUÉS
const { data: profilesData } = await supabase
  .from("profiles_with_auth")
  .select("*")
  .is("deleted_at", null)
```

**Cambio 2: Actualizar email**
```javascript
// ANTES (línea 473)
await supabase.from("profiles").update({ email: form.email })

// DESPUÉS
await supabase.auth.updateUser({ email: form.email })
// Ya no se actualiza en profiles
```

**NO tocar:** Resto del código (displays, modals) sigue igual - el VIEW provee email

---

#### Archivo 2: `src/pages/ProfilePage.jsx`

**Cambio: Fallback de nombre**
```javascript
// ANTES (línea 27, 139)
currentProfile?.name || currentSession.user.email

// DESPUÉS
currentProfile?.name || 
currentSession.user.user_metadata?.full_name || 
currentSession.user.email
```

---

#### Archivo 3: `src/pages/SettingsPage.jsx`

**NUEVO: Agregar sección "Seguridad"**
```javascript
// Nueva tab en settings: "Seguridad"
// Permite:
// - Ver email actual (desde session.user.email)
// - Cambiar email (supabase.auth.updateUser)
// - Cambiar password (supabase.auth.updateUser)
// - Agregar password si no tiene (OAuth users)
```

---

### CAPA 3: Nuevas Features Modulares

#### Feature 1: `/configuracion/seguridad`

**Estructura:**
```
src/features/auth/
├── pages/
│   └── SecurityPage.jsx  ← NUEVO
├── components/
│   ├── ChangeEmailForm.jsx  ← NUEVO
│   ├── ChangePasswordForm.jsx  ← NUEVO
│   └── AddPasswordForm.jsx  ← NUEVO (para OAuth users)
└── hooks/
    ├── useChangeEmail.js
    ├── useChangePassword.js
    └── useAddPassword.js
```

#### Feature 2: Admin - Papelera

**Estructura:**
```
src/features/admin/
├── pages/
│   ├── AdminDashboard.jsx  ← Ya existe, refactor
│   └── TrashPage.jsx  ← NUEVO (usuarios eliminados)
└── components/
    └── UserActionsMenu.jsx  ← Extraer lógica de AdminPage
```

---

## 📋 Orden de Ejecución (sin downtime)

### FASE 1: BD Preparación (mismo día)
```bash
# 1. Backup
pg_dump > backup_pre_v0.11.sql

# 2. Ejecutar migrations (en orden)
# Migration 3: CREATE VIEW profiles_with_auth
# Migration 4: CREATE TRIGGER handle_new_user (con sync email a profiles)
# Migration 5: Soft delete functions
```

**Testing:** Google OAuth debe funcionar (trigger crea profiles)

---

### FASE 2: Frontend - Queries (mismo día)
```bash
# 1. Crear branch: feature/v0.11-modular-auth
git checkout -b feature/v0.11-modular-auth

# 2. Cambios quirúrgicos (1-2 horas)
# - AdminPage: profiles → profiles_with_auth
# - ProfilePage: fallback de nombre
# - Test local: npm run dev

# 3. Build + Deploy
npm run build
git push origin feature/v0.11-modular-auth
# Merge a main → Vercel auto-deploy
```

**Testing:** Admin panel sigue funcionando, OAuth OK

---

### FASE 3: Nueva Feature - Seguridad (día siguiente)
```bash
# 1. Crear SecurityPage.jsx
# 2. Agregar rutas /configuracion/seguridad
# 3. Hooks: useChangeEmail, useChangePassword, useAddPassword
# 4. Deploy
```

**Testing:** Cambiar email, agregar password a OAuth user

---

### FASE 4: Cleanup - Eliminar email de profiles (semana siguiente)
```bash
# Solo cuando TODO esté probado en producción

# Migration 2: ALTER TABLE profiles DROP COLUMN email
# Migration 4b: UPDATE trigger (ya no sincroniza email)
```

**Testing:** Verificar que nada se rompe

---

## 🗂️ Estructura Modular Final

```
src/
├── App.jsx  ← Router principal
├── components/
│   └── ui/  ← Componentes compartidos
├── features/  ← NUEVO: Features modulares
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── SecurityPage.jsx
│   │   │   └── CompleteProfilePage.jsx
│   │   ├── components/
│   │   │   ├── GoogleButton.jsx
│   │   │   ├── ChangeEmailForm.jsx
│   │   │   └── AddPasswordForm.jsx
│   │   └── hooks/
│   │       ├── useAuth.js
│   │       ├── useChangeEmail.js
│   │       └── useAddPassword.js
│   ├── profile/
│   │   ├── pages/
│   │   │   ├── ProfilePage.jsx  ← Mover desde src/pages
│   │   │   └── SettingsPage.jsx
│   │   └── components/
│   │       └── AvatarUpload.jsx
│   ├── gifts/
│   │   ├── pages/
│   │   │   ├── CelebrantDashboard.jsx
│   │   │   ├── ExplorePage.jsx
│   │   │   └── ManagerDashboard.jsx
│   │   └── components/
│   │       └── GiftCard.jsx
│   └── admin/
│       ├── pages/
│       │   ├── AdminDashboard.jsx
│       │   └── TrashPage.jsx
│       └── components/
│           └── UserActionsMenu.jsx
└── pages/  ← LEGACY (ir migrando)
    └── (mover a features/)
```

---

## ✅ Checklist de Validación

### Pre-Migration
- [ ] Backup BD completo
- [ ] Documentar usuarios actuales (count)
- [ ] Branch feature/v0.11-modular-auth

### Post-Migration BD
- [ ] Google OAuth funciona (nuevo signup)
- [ ] Email+password funciona
- [ ] Admin panel muestra emails
- [ ] No hay usuarios rotos

### Post-Migration Frontend
- [ ] AdminPage carga usuarios
- [ ] AdminPage muestra emails verificados
- [ ] ProfilePage muestra nombres correctos
- [ ] Settings permite editar phone/birthday
- [ ] No hay errores en console

### Nuevas Features
- [ ] /configuracion/seguridad existe
- [ ] Cambiar email funciona
- [ ] Cambiar password funciona
- [ ] Agregar password (OAuth) funciona
- [ ] Admin puede ver papelera
- [ ] Soft delete funciona
- [ ] Restore funciona

---

## 🔄 Rollback Plan

Si algo falla:

### Rollback BD:
```bash
psql < backup_pre_v0.11.sql
```

### Rollback Frontend:
```bash
git revert <commit-hash>
git push origin main
# Vercel auto-deploya versión anterior
```

---

## 📝 Registro en VERSION_HISTORY.md

```markdown
| **0.11** | 02-abr | XXXXX | Arquitectura auth modular | Opción A: email en auth.users, VIEW profiles_with_auth, trigger que CREA profiles, soft delete, código modular por features | ✅ OK | "vamos con la opcion A, que contemple que el usuario si se registro via google o algun proveedor, que pueda agregars un paasword..." |
```

---

## 🎯 Próximos Pasos INMEDIATOS

1. **APROBAR:** ¿Te parece bien este plan por fases?
2. **FASE 1:** Ejecutar migrations 3, 4, 5 (sin tocar email en profiles)
3. **FASE 2:** Cambios quirúrgicos en AdminPage + ProfilePage
4. **FASE 3:** Nueva feature SecurityPage
5. **FASE 4:** (semana siguiente) Eliminar email de profiles

**Ventaja de este plan:**
- ✅ Cero downtime
- ✅ Cada fase es reversible
- ✅ Features actuales NO se rompen
- ✅ Testing incremental
- ✅ Modular desde el inicio
