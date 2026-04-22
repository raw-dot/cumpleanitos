-- Agregar columnas de configuración de comisiones a gift_campaigns
ALTER TABLE IF EXISTS gift_campaigns
ADD COLUMN IF NOT EXISTS commission_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2) DEFAULT 10.00;

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_gift_campaigns_commission_enabled 
ON gift_campaigns(commission_enabled);

-- Comentar las columnas
COMMENT ON COLUMN gift_campaigns.commission_enabled IS 'Si la comisión está habilitada para este regalo';
COMMENT ON COLUMN gift_campaigns.commission_percentage IS 'Porcentaje de comisión que retiene la plataforma (0-100)';
