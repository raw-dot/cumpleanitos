-- Deshabilitar el trigger roto que causa "Error updating user"
-- La app creará profiles manualmente desde el frontend

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;

-- Comentario
COMMENT ON TABLE profiles IS 'Profiles creados manualmente desde frontend. Triggers deshabilitados.';
