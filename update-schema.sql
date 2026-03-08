-- Add new columns to profiles table for birthday registration data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS days_to_birthday INTEGER;

-- Create an index on phone for potential future WhatsApp integration
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON profiles(phone);
