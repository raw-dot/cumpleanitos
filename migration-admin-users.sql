-- EJECUTAR EN: supabase.com → tu proyecto → SQL Editor → New query → Run
-- Función para obtener todos los usuarios con sus emails desde auth.users

CREATE OR REPLACE FUNCTION get_all_users_with_email()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  username text,
  name text,
  phone text,
  birthday date,
  age integer,
  days_to_birthday integer,
  role text,
  is_admin boolean,
  is_active boolean,
  avatar_url text,
  cover_url text,
  cover_gradient text,
  cover_position text,
  avatar_position text,
  avatar_scale numeric,
  cover_scale numeric,
  payment_alias text,
  email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.created_at,
    p.username,
    p.name,
    p.phone,
    p.birthday,
    p.age,
    p.days_to_birthday,
    p.role,
    p.is_admin,
    COALESCE(p.is_active, true) as is_active,
    p.avatar_url,
    p.cover_url,
    p.cover_gradient,
    p.cover_position,
    p.avatar_position,
    p.avatar_scale,
    p.cover_scale,
    p.payment_alias,
    au.email
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
