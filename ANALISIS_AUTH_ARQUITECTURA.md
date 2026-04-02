# 🔍 Análisis Arquitectura de Autenticación - Cumpleanitos

## Estado Actual (ROTO)

### Tablas:
- `auth.users` (Supabase Auth) - email, password, OAuth providers
- `profiles` (custom) - username, name, birthday, phone, email, etc

### Triggers actuales:
1. ✅ `sync_email_on_change` - AFTER UPDATE en auth.users (funciona)
2. ❌ `sync_email_on_signup` - AFTER INSERT en auth.users (ROTO - solo UPDATE, no INSERT)

### Problemas identificados:

**P1: Trigger de creación roto**
- Google OAuth → crea user en auth.users
- Trigger hace UPDATE profiles (pero profile NO EXISTE)
- App crashea: "Database error saving new user"

**P2: Duplicación de email**
- Email en auth.users (Supabase)
- Email en profiles (custom)
- UNIQUE INDEX en profiles.email
- Sincronización manual propensa a errores

**P3: No hay soft delete**
- Eliminar cuenta = hard delete
- No hay quarentena/recuperación

**P4: No hay estrategia multi-provider**
- Si usuario se registra con Google (email@gmail.com)
- Después quiere agregar password para mismo email
- No hay lógica para linkear cuentas

---

## Requerimientos Funcionales

### RF1: Registro
- ✅ Email + password
- ✅ Google OAuth
- ✅ Futuros: Facebook, Apple (extensible)

### RF2: Login
- ✅ Email + password
- ✅ Google OAuth
- ✅ Permitir login con password si se registró con Google (agregar password después)

### RF3: Editar perfil
- ✅ Username, name, birthday, phone
- ✅ Email (sincronizar con auth.users)
- ⚠️ Avatar, cover (storage)

### RF4: Cambiar password
- ✅ Usuario con password → cambiar password
- ✅ Usuario sin password (Google) → agregar password

### RF5: Eliminar cuenta
- ✅ Soft delete: marcar como "deleted_at" + ocultar
- ✅ Quarentena: 30 días antes de hard delete
- ✅ Admin puede revertir en quarentena

---

## Arquitectura Propuesta

### Opción A: Single Source of Truth (RECOMENDADO)

**Principio:** `auth.users` es la fuente única de verdad para auth

```
auth.users (Supabase Auth)
├── id (uuid)
├── email (único)
├── encrypted_password
├── provider (google, email, etc)
├── raw_user_meta_data (JSON: name, avatar, etc)
└── deleted_at (timestamp) ← AGREGAMOS

profiles (app data)
├── id (FK → auth.users.id)
├── username (único)
├── birthday
├── phone
├── role
├── is_admin
├── is_active
├── avatar_url
├── cover_url
└── NO duplicar email (leer desde auth.users via JOIN)
```

**Ventajas:**
- Email único garantizado por Supabase
- Multi-provider automático (Supabase maneja linking)
- Cambiar email/password = API de Supabase
- Triggers más simples

**Cambios necesarios:**
1. ❌ ELIMINAR columna `email` de profiles
2. ✅ Crear VIEW `profiles_with_email` que joinea auth.users
3. ✅ Trigger `handle_new_user()` que CREA profile en INSERT
4. ✅ Soft delete via `deleted_at` en auth.users
5. ✅ RPC functions para admin (restore, hard delete)

---

### Opción B: Keep Email Copy (status quo mejorado)

**Principio:** Mantener email en profiles pero sincronizado

```
auth.users
├── id
├── email
├── encrypted_password
└── deleted_at ← AGREGAMOS

profiles
├── id
├── email ← mantener sincronizado
├── email_verified
├── username
├── deleted_at ← AGREGAMOS
└── ...resto
```

**Ventajas:**
- Menos cambios estructurales
- Queries más simples (no JOIN)
- Email siempre disponible en profiles

**Desventajas:**
- Doble fuente de verdad (propenso a desincronización)
- Triggers más complejos (sync bidireccional)
- UNIQUE constraint puede fallar en edge cases

---

## Decisión Crítica

¿Cuál arquitectura elegís?

**Opción A (recomendada):** Limpia, escalable, menos bugs
**Opción B:** Menos cambios ahora, más mantenimiento futuro

---

## Estructura de Código Propuesta (modular)

```
src/
├── features/
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         (/login)
│   │   │   ├── RegisterPage.jsx      (/registro)
│   │   │   ├── ForgotPasswordPage.jsx (/recuperar)
│   │   │   └── CompleteProfilePage.jsx (/completar-perfil)
│   │   ├── components/
│   │   │   ├── GoogleButton.jsx
│   │   │   ├── EmailPasswordForm.jsx
│   │   │   └── AuthGuard.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useSession.js
│   │   └── utils/
│   │       └── authHelpers.js
│   ├── profile/
│   │   ├── pages/
│   │   │   ├── ProfilePage.jsx       (/perfil/:username)
│   │   │   ├── EditProfilePage.jsx   (/configuracion)
│   │   │   └── SecurityPage.jsx      (/configuracion/seguridad)
│   │   └── components/
│   │       ├── ProfileCard.jsx
│   │       └── AvatarUpload.jsx
│   └── admin/
│       ├── pages/
│       │   ├── AdminDashboard.jsx    (/admin)
│       │   ├── UsersPage.jsx         (/admin/usuarios)
│       │   └── TrashPage.jsx         (/admin/papelera)
│       └── components/
│           └── UserActionsMenu.jsx
```

---

## Rutas Propuestas

```
/ - Home/Landing
/login - Login
/registro - Registro
/recuperar - Recuperar contraseña
/completar-perfil - Post-OAuth onboarding

/perfil/:username - Perfil público
/dashboard - Mi dashboard (auth required)
/configuracion - Editar perfil (auth required)
/configuracion/seguridad - Cambiar email/password (auth required)

/admin - Panel admin (admin required)
/admin/usuarios - Gestión usuarios
/admin/papelera - Usuarios eliminados (soft delete)
```

---

## Migrations Necesarias

### Para Opción A:
1. `add_deleted_at_to_auth_users.sql`
2. `remove_email_from_profiles.sql`
3. `create_profiles_with_email_view.sql`
4. `create_handle_new_user_trigger.sql`
5. `create_soft_delete_functions.sql`

### Para Opción B:
1. `add_deleted_at_to_profiles.sql`
2. `fix_sync_email_on_signup_trigger.sql` (INSERT + UPDATE)
3. `create_soft_delete_functions.sql`

---

---

## ✅ DECISIÓN: Opción A + Extensiones

### Extensiones adicionales:

**EXT1: Agregar password a cuenta OAuth**
- Usuario registrado con Google (sin password)
- Puede agregar password desde `/configuracion/seguridad`
- Luego login con email+password O Google (ambos)
- Supabase maneja automáticamente (linkIdentities API)

**EXT2: Phone authentication (futuro)**
- Nueva columna en auth.users: `phone` (Supabase Auth soporta nativamente)
- Login con phone + OTP
- Registro con phone + verificación SMS
- Mismo user puede tener: email, Google, phone (múltiples métodos)

**EXT3: Multi-método para mismo usuario**
```
User puede autenticarse con:
├── Google OAuth (raw_user_meta_data.provider = 'google')
├── Email + Password (email + encrypted_password)
└── Phone + OTP (phone + confirmation_sent_at)

Todos apuntan al MISMO user.id en auth.users
```

---

## Arquitectura Final (Opción A extendida)

### Schema auth.users (Supabase Auth)
```sql
auth.users
├── id (uuid, PK)
├── email (text, unique, nullable) 
├── phone (text, unique, nullable)  ← Para phone auth futuro
├── encrypted_password (text, nullable)  ← NULL si solo OAuth
├── email_confirmed_at (timestamp)
├── phone_confirmed_at (timestamp)
├── raw_user_meta_data (jsonb)  ← name, avatar de OAuth
├── created_at (timestamp)
├── updated_at (timestamp)
└── deleted_at (timestamp)  ← SOFT DELETE
```

### Schema profiles (App data)
```sql
profiles
├── id (uuid, PK, FK → auth.users.id)
├── username (text, unique, NOT NULL)
├── name (text, NOT NULL)
├── birthday (date, NOT NULL)
├── phone (text)  ← Teléfono de contacto (diferente a auth.users.phone)
├── role (text, DEFAULT 'celebrant')
├── is_admin (boolean, DEFAULT false)
├── is_active (boolean, DEFAULT true)
├── avatar_url (text)
├── cover_url (text)
├── cover_gradient (text)
├── cover_position (text)
├── avatar_position (text)
├── avatar_scale (numeric)
├── cover_scale (numeric)
├── payment_alias (text)
├── created_at (timestamp)
└── updated_at (timestamp)

-- NO duplicar email, phone, deleted_at (están en auth.users)
```

### VIEW profiles_with_auth
```sql
CREATE VIEW profiles_with_auth AS
SELECT 
  p.*,
  au.email,
  au.phone as auth_phone,
  au.email_confirmed_at IS NOT NULL as email_verified,
  au.phone_confirmed_at IS NOT NULL as phone_verified,
  au.encrypted_password IS NOT NULL as has_password,
  au.deleted_at,
  au.deleted_at IS NOT NULL as is_deleted
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;
```

---

## Migrations Detalladas

### Migration 1: `2026-04-02_add-soft-delete-to-auth.sql`
```sql
-- Agregar soft delete a auth.users (Supabase Admin API required)
-- EJECUTAR: Via Supabase service_role key con curl

-- Nota: auth.users es una tabla de sistema, requiere privilegios especiales
-- Alternativa: usar user_metadata para marcar deleted_at

ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_auth_users_deleted_at 
ON auth.users(deleted_at) 
WHERE deleted_at IS NOT NULL;
```

### Migration 2: `2026-04-02_remove-email-from-profiles.sql`
```sql
-- Paso 1: Verificar que todos los profiles tienen auth.users
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE au.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Found % orphan profiles without auth.users', orphan_count;
  END IF;
END $$;

-- Paso 2: Drop constraints que dependen de email
DROP INDEX IF EXISTS profiles_email_key;
ALTER TABLE profiles DROP COLUMN IF EXISTS email;
ALTER TABLE profiles DROP COLUMN IF EXISTS email_verified;
```

### Migration 3: `2026-04-02_create-profiles-view.sql`
```sql
CREATE OR REPLACE VIEW profiles_with_auth AS
SELECT 
  p.id,
  p.username,
  p.name,
  p.birthday,
  p.phone as contact_phone,
  p.role,
  p.is_admin,
  p.is_active,
  p.avatar_url,
  p.cover_url,
  p.cover_gradient,
  p.cover_position,
  p.avatar_position,
  p.avatar_scale,
  p.cover_scale,
  p.payment_alias,
  p.created_at as profile_created_at,
  -- Campos de auth.users
  au.email,
  au.phone as auth_phone,
  au.email_confirmed_at IS NOT NULL as email_verified,
  au.phone_confirmed_at IS NOT NULL as phone_verified,
  au.encrypted_password IS NOT NULL as has_password,
  au.raw_user_meta_data,
  au.created_at as auth_created_at,
  au.deleted_at,
  au.deleted_at IS NOT NULL as is_deleted,
  -- Edad calculada
  EXTRACT(YEAR FROM age(p.birthday)) as age,
  -- Días hasta cumpleaños
  CASE 
    WHEN EXTRACT(MONTH FROM p.birthday) * 100 + EXTRACT(DAY FROM p.birthday) >= 
         EXTRACT(MONTH FROM CURRENT_DATE) * 100 + EXTRACT(DAY FROM CURRENT_DATE)
    THEN (DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-' || 
               EXTRACT(MONTH FROM p.birthday) || '-' || 
               EXTRACT(DAY FROM p.birthday)) - CURRENT_DATE)
    ELSE (DATE((EXTRACT(YEAR FROM CURRENT_DATE) + 1) || '-' || 
               EXTRACT(MONTH FROM p.birthday) || '-' || 
               EXTRACT(DAY FROM p.birthday)) - CURRENT_DATE)
  END as days_to_birthday
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.deleted_at IS NULL;  -- Excluir usuarios eliminados

-- Grant permisos
GRANT SELECT ON profiles_with_auth TO authenticated;
GRANT SELECT ON profiles_with_auth TO anon;
```

### Migration 4: `2026-04-02_create-handle-new-user-trigger.sql`
```sql
-- Función: crear profile automáticamente cuando se crea user en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_username TEXT;
BEGIN
  -- Extraer nombre de metadata (Google OAuth) o usar default
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Usuario'
  );
  
  -- Generar username único temporal
  user_username := 'user_' || substring(NEW.id::text from 1 for 8);
  
  -- Insertar profile
  INSERT INTO public.profiles (
    id,
    username,
    name,
    birthday,
    role
  )
  VALUES (
    NEW.id,
    user_username,
    user_name,
    '2000-01-01'::date,  -- Birthday temporal (usuario debe completarlo)
    'celebrant'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Si ya existe el profile, no hacer nada (caso edge: re-signup)
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error pero no romper el signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentario
COMMENT ON FUNCTION public.handle_new_user IS 
  'Crea automáticamente un profile cuando se registra un nuevo usuario (email, Google, phone, etc)';
```

### Migration 5: `2026-04-02_create-soft-delete-functions.sql`
```sql
-- Función: soft delete de usuario
CREATE OR REPLACE FUNCTION soft_delete_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Marcar como eliminado en auth.users
  UPDATE auth.users
  SET deleted_at = NOW()
  WHERE id = user_id AND deleted_at IS NULL;
  
  -- Desactivar en profiles
  UPDATE profiles
  SET is_active = false
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Función: restaurar usuario de quarentena
CREATE OR REPLACE FUNCTION restore_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Quitar marca de eliminado
  UPDATE auth.users
  SET deleted_at = NULL
  WHERE id = user_id AND deleted_at IS NOT NULL;
  
  -- Reactivar en profiles
  UPDATE profiles
  SET is_active = true
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Función: hard delete permanente (después de 30 días)
CREATE OR REPLACE FUNCTION permanently_delete_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que está en quarentena hace más de 30 días
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days'
  ) THEN
    RAISE EXCEPTION 'User must be in quarantine for 30+ days before permanent deletion';
  END IF;
  
  -- Eliminar de profiles (cascade eliminará gift_campaigns, etc)
  DELETE FROM profiles WHERE id = user_id;
  
  -- Eliminar de auth.users (requiere service_role)
  DELETE FROM auth.users WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Función automática: limpiar usuarios antiguos (cron job)
CREATE OR REPLACE FUNCTION cleanup_old_deleted_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM profiles
    WHERE id IN (
      SELECT id FROM auth.users
      WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  -- Log resultado
  RAISE NOTICE 'Cleaned up % old deleted users', deleted_count;
  
  RETURN deleted_count;
END;
$$;

-- Grant permisos (solo admins pueden ejecutar)
REVOKE ALL ON FUNCTION soft_delete_user FROM PUBLIC;
REVOKE ALL ON FUNCTION restore_user FROM PUBLIC;
REVOKE ALL ON FUNCTION permanently_delete_user FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_old_deleted_users FROM PUBLIC;
```

### Migration 6: `2026-04-02_update-rls-policies.sql`
```sql
-- Drop políticas viejas relacionadas con email
DROP POLICY IF EXISTS "Users can update own email" ON profiles;

-- Nueva política: usuarios pueden ver su propio profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Nueva política: usuarios pueden actualizar su propio profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: profiles públicos son visibles para todos
CREATE POLICY "Public profiles are viewable" ON profiles
  FOR SELECT
  USING (is_active = true);

-- Política: admins pueden ver todo
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

---

## Código Frontend (Modular)

### Estructura propuesta:
```
src/
├── features/
│   └── auth/
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── SecurityPage.jsx  ← NUEVO: cambiar email/password, agregar password
│       │   └── CompleteProfilePage.jsx
│       ├── hooks/
│       │   ├── useAddPassword.js  ← NUEVO: agregar password a OAuth user
│       │   ├── useChangeEmail.js  ← NUEVO: cambiar email
│       │   └── useChangePassword.js  ← NUEVO: cambiar password
│       └── utils/
│           └── authHelpers.js
```

### Hook: useAddPassword.js
```javascript
// Para usuarios OAuth que quieren agregar password
export function useAddPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const addPassword = async (newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      // Supabase API: update user password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  return { addPassword, loading, error };
}
```

---

## Plan de Implementación (v0.11)

### Fase 1: Preparación (pre-deploy)
1. ✅ Backup completo de BD
2. ✅ Documentar usuarios actuales
3. ✅ Testing en branch separado

### Fase 2: Migrations (ejecutar en orden)
1. Migration 1: Add soft delete
2. Migration 2: Remove email from profiles
3. Migration 3: Create VIEW
4. Migration 4: New trigger
5. Migration 5: Soft delete functions
6. Migration 6: RLS policies

### Fase 3: Frontend (por pantalla)
1. `/configuracion/seguridad` - Cambiar email, password, agregar password
2. Actualizar queries: `profiles` → `profiles_with_auth`
3. Admin panel: mostrar usuarios eliminados
4. Testing completo

### Fase 4: Deploy & Monitoring
1. Deploy a producción
2. Monitorear signups/logins
3. Validar soft delete
4. Documentar en VERSION_HISTORY.md como v0.11

---

## Próximos Pasos INMEDIATOS

1. **REVISAR:** ¿Aprobás este plan completo?
2. **EJECUTAR:** Migrations 1-6 en orden
3. **MOCKUP:** Pantalla `/configuracion/seguridad`
4. **IMPLEMENTAR:** Código frontend modular
5. **VERSIONAR:** Registrar como v0.11 en VERSION_HISTORY.md

