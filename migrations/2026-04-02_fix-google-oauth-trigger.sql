-- FIX: Trigger para crear profile automáticamente cuando se registra un usuario
-- Problema: migration-email-core.sql solo hacía UPDATE, no INSERT
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query → Run

-- 1. Reemplazar función sync_email_on_signup para que CREE el profile si no existe
CREATE OR REPLACE FUNCTION sync_email_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
  base_username TEXT;
  counter INT := 0;
  profile_exists BOOLEAN;
BEGIN
  -- Verificar si el profile ya existe
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF profile_exists THEN
    -- Si existe, solo actualizar email
    UPDATE profiles
    SET email = NEW.email,
        email_verified = NEW.email_confirmed_at IS NOT NULL
    WHERE id = NEW.id;
  ELSE
    -- Si NO existe, crear el profile nuevo
    
    -- Generar username base desde email o nombre de Google
    IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
      base_username := LOWER(REGEXP_REPLACE(
        NEW.raw_user_meta_data->>'full_name',
        '[^a-zA-Z0-9]', '_', 'g'
      ));
    ELSIF NEW.raw_user_meta_data->>'name' IS NOT NULL THEN
      base_username := LOWER(REGEXP_REPLACE(
        NEW.raw_user_meta_data->>'name',
        '[^a-zA-Z0-9]', '_', 'g'
      ));
    ELSIF NEW.email IS NOT NULL THEN
      base_username := LOWER(REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]', '_', 'g'
      ));
    ELSE
      base_username := 'user';
    END IF;

    -- Limpiar guiones bajos consecutivos y limitar largo
    base_username := REGEXP_REPLACE(base_username, '_+', '_', 'g');
    base_username := REGEXP_REPLACE(base_username, '^_|_$', '', 'g');
    base_username := SUBSTRING(base_username FROM 1 FOR 20);
    
    -- Si está vacío, usar 'user'
    IF base_username = '' THEN
      base_username := 'user';
    END IF;

    -- Generar username único
    generated_username := base_username;
    
    -- Si el username ya existe, agregar número
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = generated_username) LOOP
      counter := counter + 1;
      generated_username := base_username || '_' || counter;
    END LOOP;

    -- Crear el profile nuevo con datos de Google
    INSERT INTO profiles (
      id,
      email,
      name,
      username,
      role,
      email_verified
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        'Usuario'
      ),
      generated_username,
      'celebrant',
      NEW.email_confirmed_at IS NOT NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. El trigger on_auth_user_created ya existe desde migration-email-core.sql
-- No necesitamos recrearlo, solo reemplazamos la función

-- 3. Verificar que todo está OK
SELECT 
  'Trigger existe:' as check_type,
  COUNT(*) as result
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
UNION ALL
SELECT 
  'Función actualizada:' as check_type,
  CASE WHEN proname = 'sync_email_on_signup' THEN 1 ELSE 0 END as result
FROM pg_proc
WHERE proname = 'sync_email_on_signup'
LIMIT 2;
