-- Diagnóstico completo del trigger de Google OAuth
-- Ejecutar en Supabase SQL Editor para ver qué está fallando

-- 1. Verificar que el trigger existe
SELECT 
  'Trigger on_auth_user_created' as check_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ No existe' END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar que la función sync_email_on_signup existe
SELECT 
  'Función sync_email_on_signup' as check_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ No existe' END as status
FROM pg_proc
WHERE proname = 'sync_email_on_signup';

-- 3. Verificar estructura de la tabla profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Verificar que exec_sql existe y tiene permisos
SELECT 
  'Función exec_sql' as check_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ No existe' END as status
FROM pg_proc
WHERE proname = 'exec_sql';

-- 5. Ver el código completo del trigger actual
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'sync_email_on_signup';
