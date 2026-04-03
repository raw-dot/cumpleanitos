-- Agregar columna deleted_at para soft delete
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Índice para queries de usuarios activos
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- Agregar a gift_campaigns también
ALTER TABLE gift_campaigns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
