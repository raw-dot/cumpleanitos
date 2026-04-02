-- EJECUTAR EN: supabase.com → tu proyecto → SQL Editor → New query → Run
-- Agrega las columnas necesarias para fotos de perfil y posicionamiento

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_gradient TEXT DEFAULT 'linear-gradient(135deg, #7C3AED 0%, #9C27B0 50%, #F59E0B 100%)';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_position TEXT DEFAULT '50% 50%';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_position TEXT DEFAULT '50% 50%';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_scale NUMERIC DEFAULT 1.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_scale NUMERIC DEFAULT 1.0;
