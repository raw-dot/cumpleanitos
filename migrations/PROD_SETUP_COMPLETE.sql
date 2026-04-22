-- ============================================================
-- cumpleanitos.com — PRODUCCIÓN: Setup completo de DB
-- Ejecutar en: Supabase SQL Editor del proyecto de PROD
-- Orden: ejecutar este archivo completo de una sola vez
-- Fecha: 2026-04-08
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- 1. TABLA PRINCIPAL: profiles
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  email             TEXT,
  email_verified    BOOLEAN DEFAULT FALSE,
  phone             TEXT,
  birthday          DATE,
  age               INT,
  days_to_birthday  INT,
  role              TEXT DEFAULT 'celebrant' CHECK (role IN ('celebrant', 'gifter', 'manager')),
  is_admin          BOOLEAN DEFAULT FALSE,
  avatar_url        TEXT,
  cover_url         TEXT,
  cover_gradient    TEXT DEFAULT 'linear-gradient(135deg, #7C3AED 0%, #9C27B0 50%, #F59E0B 100%)',
  cover_position    TEXT DEFAULT '50% 50%',
  avatar_position   TEXT DEFAULT '50% 50%',
  avatar_scale      NUMERIC DEFAULT 1.0,
  cover_scale       NUMERIC DEFAULT 1.0,
  payment_alias     TEXT,
  deleted_at        TIMESTAMPTZ DEFAULT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- RLS profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "profiles_select_public"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY IF NOT EXISTS "profiles_insert_own"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles_update_own"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles_delete_own"
  ON profiles FOR DELETE USING (auth.uid() = id);


-- ══════════════════════════════════════════════════════════════
-- 2. TABLA: gift_campaigns
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS gift_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_person_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  manager_id        UUID REFERENCES profiles(id),
  title             TEXT,
  description       TEXT,
  target_amount     NUMERIC(12,2),
  deadline          DATE,
  status            TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  is_public         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gift_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "campaigns_select_public"
  ON gift_campaigns FOR SELECT USING (TRUE);

CREATE POLICY IF NOT EXISTS "campaigns_insert_own"
  ON gift_campaigns FOR INSERT WITH CHECK (auth.uid() = birthday_person_id);

CREATE POLICY IF NOT EXISTS "campaigns_update_own"
  ON gift_campaigns FOR UPDATE USING (auth.uid() = birthday_person_id OR auth.uid() = manager_id);

CREATE POLICY IF NOT EXISTS "campaigns_delete_own"
  ON gift_campaigns FOR DELETE USING (auth.uid() = birthday_person_id);


-- ══════════════════════════════════════════════════════════════
-- 3. TABLA: gift_items
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS gift_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES gift_campaigns(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(12,2),
  url           TEXT,
  image_url     TEXT,
  is_selected   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "gift_items_select_public"
  ON gift_items FOR SELECT USING (TRUE);

CREATE POLICY IF NOT EXISTS "gift_items_insert_campaign_owner"
  ON gift_items FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gift_campaigns
      WHERE id = campaign_id AND birthday_person_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "gift_items_update_campaign_owner"
  ON gift_items FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM gift_campaigns
      WHERE id = campaign_id AND birthday_person_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "gift_items_delete_campaign_owner"
  ON gift_items FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM gift_campaigns
      WHERE id = campaign_id AND birthday_person_id = auth.uid()
    )
  );


-- ══════════════════════════════════════════════════════════════
-- 4. TABLA: contributions
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS contributions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID NOT NULL REFERENCES gift_campaigns(id) ON DELETE CASCADE,
  gift_item_id        UUID REFERENCES gift_items(id) ON DELETE SET NULL,
  gifter_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  gifter_name         TEXT,
  gifter_email        TEXT,
  amount              NUMERIC(12,2) NOT NULL,
  message             TEXT,
  is_anonymous        BOOLEAN DEFAULT FALSE,
  anonymous           BOOLEAN DEFAULT FALSE,
  payment_method      TEXT DEFAULT 'manual' CHECK (payment_method IN ('manual', 'mercadopago')),
  mp_order_id         UUID,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  emotional_foto_url  TEXT,
  emotional_video_url TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "contributions_select_public"
  ON contributions FOR SELECT USING (TRUE);

CREATE POLICY IF NOT EXISTS "contributions_insert_authenticated"
  ON contributions FOR INSERT WITH CHECK (TRUE);

CREATE POLICY IF NOT EXISTS "contributions_update_own"
  ON contributions FOR UPDATE USING (auth.uid() = gifter_id);


-- ══════════════════════════════════════════════════════════════
-- 5. TABLA: app_config
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS app_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "app_config_select_public"
  ON app_config FOR SELECT USING (TRUE);

CREATE POLICY IF NOT EXISTS "app_config_update_admin"
  ON app_config FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Valores por defecto
INSERT INTO app_config (key, value, description) VALUES
  ('gift_presets', '[500,1000,2000,5000]', 'Montos preset para aportes en ARS'),
  ('platform_fee_pct', '5', 'Comisión de la plataforma en %'),
  ('min_contribution', '100', 'Aporte mínimo en ARS')
ON CONFLICT (key) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- 6. TABLA: friends
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS friends (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "friends_select_own"
  ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY IF NOT EXISTS "friends_insert_own"
  ON friends FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "friends_delete_own"
  ON friends FOR DELETE USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════
-- 7. TABLAS: Mercado Pago
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mp_connections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mp_user_id          TEXT,
  mp_email            TEXT,
  mp_nickname         TEXT,
  access_token        TEXT NOT NULL,
  refresh_token       TEXT,
  token_expires_at    TIMESTAMPTZ,
  scopes              TEXT,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'error')),
  connected_at        TIMESTAMPTZ DEFAULT NOW(),
  last_validated_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS mp_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID NOT NULL REFERENCES gift_campaigns(id) ON DELETE CASCADE,
  gift_item_id        UUID REFERENCES gift_items(id) ON DELETE SET NULL,
  contribution_id     UUID REFERENCES contributions(id) ON DELETE SET NULL,
  seller_user_id      UUID NOT NULL REFERENCES profiles(id),
  payer_name          TEXT NOT NULL,
  payer_user_id       UUID REFERENCES profiles(id),
  is_anonymous        BOOLEAN DEFAULT FALSE,
  message             TEXT,
  gross_amount        NUMERIC(12,2) NOT NULL,
  currency            TEXT DEFAULT 'ARS',
  platform_fee_pct    NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  platform_fee_amount NUMERIC(12,2) NOT NULL,
  net_amount          NUMERIC(12,2) NOT NULL,
  mp_preference_id    TEXT,
  mp_init_point       TEXT,
  external_reference  TEXT NOT NULL UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','approved','rejected','cancelled','refunded','chargeback','in_process')
  ),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mp_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES mp_orders(id),
  mp_payment_id         TEXT UNIQUE,
  mp_merchant_order_id  TEXT,
  mp_status             TEXT,
  mp_status_detail      TEXT,
  mp_payment_method     TEXT,
  mp_payment_type       TEXT,
  gross_amount          NUMERIC(12,2),
  approved_at           TIMESTAMPTZ,
  raw_payload           JSONB,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mp_commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES mp_orders(id),
  transaction_id    UUID REFERENCES mp_transactions(id),
  fee_pct           NUMERIC(5,2) NOT NULL,
  fee_amount        NUMERIC(12,2) NOT NULL,
  settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'settled', 'reversed')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mp_webhook_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic               TEXT,
  action              TEXT,
  resource_id         TEXT,
  external_reference  TEXT,
  payload             JSONB,
  received_at         TIMESTAMPTZ DEFAULT NOW(),
  processed_at        TIMESTAMPTZ,
  processing_status   TEXT DEFAULT 'received' CHECK (
    processing_status IN ('received','processed','error','duplicate')
  ),
  error_message       TEXT
);

-- RLS MP tables
ALTER TABLE mp_connections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_commissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mp_connections_own_user"
  ON mp_connections FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "mp_orders_participants"
  ON mp_orders FOR SELECT
  USING (auth.uid() = seller_user_id OR auth.uid() = payer_user_id);

CREATE POLICY IF NOT EXISTS "mp_transactions_admin_read"
  ON mp_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY IF NOT EXISTS "mp_commissions_admin_read"
  ON mp_commissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY IF NOT EXISTS "mp_webhook_logs_admin_read"
  ON mp_webhook_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Índices MP
CREATE INDEX IF NOT EXISTS idx_mp_connections_user        ON mp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_mp_orders_campaign         ON mp_orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mp_orders_external_ref     ON mp_orders(external_reference);
CREATE INDEX IF NOT EXISTS idx_mp_orders_status           ON mp_orders(status);
CREATE INDEX IF NOT EXISTS idx_mp_orders_seller           ON mp_orders(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_payment_id ON mp_transactions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_order      ON mp_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mp_commissions_order       ON mp_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_mp_webhook_logs_resource   ON mp_webhook_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_mp_webhook_logs_ext_ref    ON mp_webhook_logs(external_reference);


-- ══════════════════════════════════════════════════════════════
-- 8. FUNCIÓN ADMIN: get_all_users_with_email
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_all_users_with_email()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  username text,
  name text,
  phone text,
  birthday date,
  age int,
  role text,
  is_admin boolean,
  avatar_url text,
  deleted_at timestamptz,
  email text,
  email_verified boolean,
  last_sign_in_at timestamptz,
  provider text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
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
    p.role,
    p.is_admin,
    p.avatar_url,
    p.deleted_at,
    u.email,
    p.email_verified,
    u.last_sign_in_at,
    u.raw_app_meta_data->>'provider' AS provider
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;


-- ══════════════════════════════════════════════════════════════
-- 9. STORAGE: buckets de imágenes
-- ══════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('cumple-images', 'cumple-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "cumple_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cumple-images');

CREATE POLICY IF NOT EXISTS "cumple_images_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cumple-images' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "cumple_images_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'cumple-images' AND auth.uid()::text = (storage.foldername(name))[2]);

CREATE POLICY IF NOT EXISTS "cumple_images_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'cumple-images' AND auth.uid()::text = (storage.foldername(name))[2]);


-- ══════════════════════════════════════════════════════════════
-- FIN DEL SETUP
-- Verificar con: SELECT table_name FROM information_schema.tables
--                WHERE table_schema = 'public' ORDER BY table_name;
-- ══════════════════════════════════════════════════════════════
