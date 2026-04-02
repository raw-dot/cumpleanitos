-- Test 1: Ver si el trigger existe
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

-- Test 2: Ver el código de la función handle_new_user
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Test 3: Ver últimos 5 usuarios en auth.users
SELECT 
  id, 
  email, 
  created_at,
  raw_user_meta_data->>'name' as google_name,
  raw_user_meta_data->>'full_name' as google_full_name
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Test 4: Ver si esos usuarios tienen profile
SELECT 
  au.email,
  au.created_at as auth_created,
  p.username,
  p.name,
  p.created_at as profile_created,
  CASE WHEN p.id IS NULL THEN 'NO PROFILE' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 5;

-- Test 5: Intentar crear un profile manualmente (simular trigger)
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Tomar el último usuario que no tenga profile
  PERFORM handle_new_user_test();
  test_result := 'Trigger test ejecutado';
  RAISE NOTICE '%', test_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en test: %', SQLERRM;
END $$;
