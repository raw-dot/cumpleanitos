-- Función RPC para ejecutar SQL arbitrario desde GitHub Actions
-- EJECUTAR MANUALMENTE EN SUPABASE SQL EDITOR (solo una vez)
-- Esto habilita la ejecución de migrations via API

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Dar permisos a service_role para ejecutar esta función
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
