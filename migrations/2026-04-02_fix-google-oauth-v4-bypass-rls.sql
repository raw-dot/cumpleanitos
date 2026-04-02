-- FIX DEFINITIVO: Bypass RLS en el trigger
-- El problema: RLS bloquea INSERT porque auth.uid() es NULL durante signup
-- Solución: Usar SET LOCAL en el trigger para bypass RLS temporalmente

CREATE OR REPLACE FUNCTION sync_email_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_exists BOOLEAN;
  temp_username TEXT;
  temp_name TEXT;
BEGIN
  -- CRÍTICO: Bypass RLS temporalmente para este trigger
  SET LOCAL role TO postgres;
  
  -- Verificar si el profile ya existe
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF profile_exists THEN
    -- Si existe, solo actualizar email
    UPDATE profiles
    SET email = NEW.email,
        email_verified = NEW.email_confirmed_at IS NOT NULL
    WHERE id = NEW.id;
  ELSE
    -- Si NO existe, crear profile con TODOS los campos obligatorios
    
    -- Username temporal
    temp_username := 'user_' || substring(NEW.id::text from 1 for 8);
    
    -- Name desde Google o default
    temp_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'Usuario'
    );
    
    -- Insertar con TODOS los campos obligatorios
    INSERT INTO profiles (
      id,
      name,
      username,
      birthday,
      email,
      role
    ) VALUES (
      NEW.id,
      temp_name,
      temp_username,
      '2000-01-01'::date,
      NEW.email,
      'celebrant'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no fallar el signup
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
