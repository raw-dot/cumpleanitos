-- Trigger para borrar auth.users cuando se borra profile
-- Esto hace que el hard delete funcione desde frontend

CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Borrar el usuario de auth.users
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS on_profile_deleted ON profiles;
CREATE TRIGGER on_profile_deleted
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user_on_profile_delete();
