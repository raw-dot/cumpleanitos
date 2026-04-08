-- ============================================================
-- Integración Mercado Pago — Tablas base
-- Versión: 0.14 | Fecha: 2026-04-08
-- ============================================================

-- 1. Conexión OAuth del cumpleañero con MP
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
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'revoked', 'error')),
  connected_at        TIMESTAMPTZ DEFAULT NOW(),
  last_validated_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Orden de pago iniciada por el regalador
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
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN (
                          'pending','approved','rejected',
                          'cancelled','refunded','chargeback','in_process'
                        )),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transacción real confirmada por MP (llega por webhook)
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

-- 4. Comisión de la plataforma por transacción aprobada
CREATE TABLE IF NOT EXISTS mp_commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES mp_orders(id),
  transaction_id    UUID REFERENCES mp_transactions(id),
  fee_pct           NUMERIC(5,2) NOT NULL,
  fee_amount        NUMERIC(12,2) NOT NULL,
  settlement_status TEXT DEFAULT 'pending'
                      CHECK (settlement_status IN ('pending', 'settled', 'reversed')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Log de webhooks recibidos — idempotencia + auditoría
CREATE TABLE IF NOT EXISTS mp_webhook_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic               TEXT,
  action              TEXT,
  resource_id         TEXT,
  external_reference  TEXT,
  payload             JSONB,
  received_at         TIMESTAMPTZ DEFAULT NOW(),
  processed_at        TIMESTAMPTZ,
  processing_status   TEXT DEFAULT 'received'
                        CHECK (processing_status IN (
                          'received','processed','error','duplicate'
                        )),
  error_message       TEXT
);

-- ── Índices ──────────────────────────────────────────────────
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

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE mp_connections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_commissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_webhook_logs ENABLE ROW LEVEL SECURITY;

-- mp_connections: el usuario solo ve y edita la suya
CREATE POLICY IF NOT EXISTS "mp_connections_own_user"
  ON mp_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- mp_orders: seller ve las propias; payer también
CREATE POLICY IF NOT EXISTS "mp_orders_participants"
  ON mp_orders FOR SELECT
  USING (auth.uid() = seller_user_id OR auth.uid() = payer_user_id);

-- mp_transactions / mp_commissions / mp_webhook_logs:
-- Sin policy pública → solo accesibles desde service_role (API routes)
-- Admins con is_admin=true pueden leer
CREATE POLICY IF NOT EXISTS "mp_transactions_admin_read"
  ON mp_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY IF NOT EXISTS "mp_commissions_admin_read"
  ON mp_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY IF NOT EXISTS "mp_webhook_logs_admin_read"
  ON mp_webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ── Columna mp_status en contributions (para enlazar aportes con pagos) ──
ALTER TABLE contributions
  ADD COLUMN IF NOT EXISTS mp_order_id UUID REFERENCES mp_orders(id),
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual'
    CHECK (payment_method IN ('manual', 'mercadopago'));

