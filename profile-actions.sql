-- Crear tabla de acciones pendientes del perfil
CREATE TABLE IF NOT EXISTS profile_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_label TEXT NOT NULL,
  action_description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, action_type)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS profile_actions_user_id_idx ON profile_actions(user_id);
CREATE INDEX IF NOT EXISTS profile_actions_completed_idx ON profile_actions(user_id, is_completed);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_profile_actions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_actions_updated_at ON profile_actions;
CREATE TRIGGER profile_actions_updated_at
BEFORE UPDATE ON profile_actions
FOR EACH ROW
EXECUTE FUNCTION update_profile_actions_timestamp();

-- Crear tabla para almacenar datos de las acciones completadas
CREATE TABLE IF NOT EXISTS profile_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_photo_url TEXT,
  payment_alias TEXT,
  identity_verified BOOLEAN DEFAULT FALSE,
  identity_verification_date TIMESTAMP WITH TIME ZONE,
  email_confirmed BOOLEAN DEFAULT FALSE,
  email_confirmed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profile_completions_user_id_idx ON profile_completions(user_id);

-- Trigger para profile_completions
DROP TRIGGER IF EXISTS profile_completions_updated_at ON profile_completions;
CREATE TRIGGER profile_completions_updated_at
BEFORE UPDATE ON profile_completions
FOR EACH ROW
EXECUTE FUNCTION update_profile_actions_timestamp();
