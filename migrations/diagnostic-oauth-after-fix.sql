-- Diagnóstico post-fix v0.11

-- 1. Verificar que el VIEW existe
SELECT 'VIEW profiles_with_auth' as test, COUNT(*) as count FROM profiles_with_auth;

-- 2. Verificar trigger
SELECT 
  'Trigger on_auth_user_created' as test,
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 3. Ver últimos usuarios en auth.users (últimos 3)
SELECT 
  'Últimos users en auth.users' as test,
  id, 
  email, 
  created_at,
  raw_user_meta_data->>'name' as google_name
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

-- 4. Ver últimos profiles (últimos 3)
SELECT 
  'Últimos profiles' as test,
  id,
  username,
  name,
  email,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 3;

-- 5. Buscar usuarios huérfanos (en auth.users pero NO en profiles)
SELECT 
  'Usuarios huérfanos (auth sin profile)' as test,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 5;

-- 6. Ver función del trigger
SELECT 
  'Código trigger handle_new_user' as test,
  pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';
