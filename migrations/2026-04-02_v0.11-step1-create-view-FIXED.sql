-- VIEW corregido solo con columnas que existen en profiles
DROP VIEW IF EXISTS profiles_with_auth;

CREATE VIEW profiles_with_auth AS
SELECT 
  p.id,
  p.username,
  p.name,
  p.birthday,
  p.phone,
  p.role,
  p.is_admin,
  p.is_active,
  p.avatar_url,
  p.payment_alias,
  p.created_at,
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
  au.email,
  au.email_confirmed_at IS NOT NULL as email_verified
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;

GRANT SELECT ON profiles_with_auth TO authenticated;
GRANT SELECT ON profiles_with_auth TO anon;
