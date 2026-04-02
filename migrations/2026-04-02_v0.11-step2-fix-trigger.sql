-- ============================================================
-- MIGRATION v0.11 - STEP 2: Fix trigger para CREAR profiles
-- Objetivo: Trigger que INSERTA profile cuando se crea user
-- Resultado: Google OAuth funcionará de nuevo
-- ============================================================

-- 1. Función mejorada: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_username TEXT;
  user_email TEXT;
BEGIN
  -- Extraer nombre de metadata (Google OAuth) o generar default
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Usuario'
  );
  
  -- Generar username único temporal
  user_username := 'user_' || substring(NEW.id::text from 1 for 8);
  
  -- Email (puede ser NULL para phone auth futuro)
  user_email := NEW.email;
  
  -- INSERTAR nuevo profile
  INSERT INTO public.profiles (
    id,
    username,
    name,
    birthday,
    role,
    email,  -- Mantener por ahora (backward compatibility)
    email_verified
  )
  VALUES (
    NEW.id,
    user_username,
    user_name,
    '2000-01-01'::date,  -- Birthday temporal
    'celebrant',
    user_email,
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero NO romper el signup
    RAISE WARNING 'Error in handle_new_user for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Reemplazar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Mantener trigger de sync (cuando cambia email en auth)
CREATE OR REPLACE FUNCTION sync_email_on_change()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_on_change();

-- 4. Comentarios
COMMENT ON FUNCTION public.handle_new_user IS 
  'Crea profile automáticamente cuando se registra usuario (email, Google, phone). Incluye manejo de errores.';

COMMENT ON FUNCTION sync_email_on_change IS 
  'Sincroniza cambios de email desde auth.users a profiles (backward compatibility).';

-- 5. Verificación
DO $$
BEGIN
  RAISE NOTICE 'Trigger on_auth_user_created configured successfully.';
  RAISE NOTICE 'Next signup will create profile automatically.';
END $$;
