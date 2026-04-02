-- ============================================================
-- MIGRATION v0.11 - STEP 1: Crear VIEW profiles_with_auth
-- Objetivo: Preparar VIEW sin tocar tabla profiles
-- Resultado: Frontend puede empezar a usar el VIEW
-- ============================================================

-- 1. Crear VIEW que joinea profiles + auth.users
CREATE OR REPLACE VIEW profiles_with_auth AS
SELECT 
  -- Campos de profiles
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
  p.updated_at as profile_updated_at,
  
  -- Campos calculados de profiles
  EXTRACT(YEAR FROM age(p.birthday))::INTEGER as age,
  CASE 
    WHEN EXTRACT(MONTH FROM p.birthday) * 100 + EXTRACT(DAY FROM p.birthday) >= 
         EXTRACT(MONTH FROM CURRENT_DATE) * 100 + EXTRACT(DAY FROM CURRENT_DATE)
    THEN (DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-' || 
               LPAD(EXTRACT(MONTH FROM p.birthday)::TEXT, 2, '0') || '-' || 
               LPAD(EXTRACT(DAY FROM p.birthday)::TEXT, 2, '0')) - CURRENT_DATE)
    ELSE (DATE((EXTRACT(YEAR FROM CURRENT_DATE) + 1) || '-' || 
               LPAD(EXTRACT(MONTH FROM p.birthday)::TEXT, 2, '0') || '-' || 
               LPAD(EXTRACT(DAY FROM p.birthday)::TEXT, 2, '0')) - CURRENT_DATE)
  END as days_to_birthday,
  
  -- Campos de auth.users (SOURCE OF TRUTH)
  au.email,
  au.phone as auth_phone,
  au.email_confirmed_at IS NOT NULL as email_verified,
  au.phone_confirmed_at IS NOT NULL as phone_verified,
  au.encrypted_password IS NOT NULL as has_password,
  au.raw_user_meta_data,
  au.created_at as auth_created_at,
  au.last_sign_in_at,
  
  -- Soft delete (preparado para futuro)
  p.deleted_at as profile_deleted_at,
  p.deleted_at IS NOT NULL as is_deleted
  
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- 2. Grant permisos
GRANT SELECT ON profiles_with_auth TO authenticated;
GRANT SELECT ON profiles_with_auth TO anon;

-- 3. Comentario
COMMENT ON VIEW profiles_with_auth IS 
  'Vista que combina profiles con auth.users. Email es source of truth desde auth.users.';

-- 4. Verificación
DO $$
DECLARE
  view_count INTEGER;
  profile_count INTEGER;
BEGIN
  -- Contar registros en VIEW
  SELECT COUNT(*) INTO view_count FROM profiles_with_auth;
  
  -- Contar registros en profiles
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  -- Verificar que coincidan
  IF view_count != profile_count THEN
    RAISE WARNING 'VIEW count (%) != profiles count (%). Review JOIN.', view_count, profile_count;
  ELSE
    RAISE NOTICE 'VIEW created successfully. % records.', view_count;
  END IF;
END $$;
