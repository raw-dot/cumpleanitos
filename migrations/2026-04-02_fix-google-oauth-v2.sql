-- FIX DEFINITIVO: Trigger minimalista para Google OAuth
-- Este trigger crea SOLO los campos esenciales, el resto los completa CompleteProfilePage

CREATE OR REPLACE FUNCTION sync_email_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists BOOLEAN;
  temp_username TEXT;
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
    -- Si NO existe, crear profile mínimo
    -- Username temporal con user_ + primeros 8 chars del UUID
    temp_username := 'user_' || substring(NEW.id::text from 1 for 8);
    
    -- Insertar con SOLO los campos requeridos
    INSERT INTO profiles (id, username, email, role)
    VALUES (
      NEW.id,
      temp_username,
      NEW.email,
      'celebrant'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- El trigger ya existe, no necesitamos recrearlo
-- Solo reemplazamos la función
