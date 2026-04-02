-- EJECUTAR EN: supabase.com → tu proyecto → SQL Editor → New query → Run
-- Migración: Email como campo core en profiles

-- 1. Agregar columna email a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 2. Crear índice único para email (evitar duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON profiles(email) WHERE email IS NOT NULL;

-- 3. Sincronizar emails existentes desde auth.users
UPDATE profiles p
SET email = au.email,
    email_verified = au.email_confirmed_at IS NOT NULL
FROM auth.users au
WHERE p.id = au.id
AND p.email IS NULL;

-- 4. Función de trigger para sincronizar email al crear usuario
CREATE OR REPLACE FUNCTION sync_email_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Al crear un nuevo usuario en auth, actualizar su perfil con el email
  UPDATE profiles
  SET email = NEW.email,
      email_verified = NEW.email_confirmed_at IS NOT NULL
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger que se ejecuta después de INSERT en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_on_signup();

-- 6. Función de trigger para sincronizar cambios de email
CREATE OR REPLACE FUNCTION sync_email_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando cambia el email en auth.users, actualizar profiles
  IF OLD.email IS DISTINCT FROM NEW.email OR 
     OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at THEN
    UPDATE profiles
    SET email = NEW.email,
        email_verified = NEW.email_confirmed_at IS NOT NULL
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger para sincronizar UPDATE de email en auth.users
DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_on_change();

-- 8. Función RPC para obtener usuarios con email (para el admin panel)
CREATE OR REPLACE FUNCTION get_all_users_with_email()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  username text,
  name text,
  email text,
  email_verified boolean,
  phone text,
  birthday date,
  age integer,
  days_to_birthday integer,
  role text,
  is_admin boolean,
  is_active boolean,
  avatar_url text,
  cover_url text,
  cover_gradient text,
  cover_position text,
  avatar_position text,
  avatar_scale numeric,
  cover_scale numeric,
  payment_alias text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.created_at,
    p.username,
    p.name,
    p.email,
    COALESCE(p.email_verified, false) as email_verified,
    p.phone,
    p.birthday,
    p.age,
    p.days_to_birthday,
    p.role,
    p.is_admin,
    COALESCE(p.is_active, true) as is_active,
    p.avatar_url,
    p.cover_url,
    p.cover_gradient,
    p.cover_position,
    p.avatar_position,
    p.avatar_scale,
    p.cover_scale,
    p.payment_alias
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Política RLS para permitir a los usuarios actualizar su propio email
DROP POLICY IF EXISTS "Users can update own email" ON profiles;
CREATE POLICY "Users can update own email" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
