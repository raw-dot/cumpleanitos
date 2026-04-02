-- Verificar políticas RLS en profiles que puedan bloquear el INSERT del trigger

-- 1. Ver si RLS está activo
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. Ver todas las políticas en profiles
SELECT 
  polname as policy_name,
  polcmd as command,
  polpermissive as permissive,
  pg_get_expr(polqual, polrelid) as using_expression,
  pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polrelid = 'profiles'::regclass;

-- 3. Ver columnas NOT NULL en profiles
SELECT 
  column_name,
  is_nullable,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
AND is_nullable = 'NO';
