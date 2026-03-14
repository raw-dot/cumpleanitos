-- ============================================================
-- MIGRATION v4 - Perfil: avatar, portada y posicionamiento
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_gradient TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_position TEXT DEFAULT '50% 50%';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_position TEXT DEFAULT '50% 50%';
