-- ============================================================
-- MIGRATION v3 - Mi Regalo: imágenes, product_link, roles
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar campos de imagen y link al regalo en gift_campaigns
ALTER TABLE gift_campaigns ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE gift_campaigns ADD COLUMN IF NOT EXISTS product_link TEXT;

-- 2. Supabase Storage: crear bucket público para imágenes de cumpleaños
-- (hacer esto desde Supabase Dashboard → Storage → New bucket)
-- Nombre: cumple-images
-- Public bucket: YES

-- 3. Política de Storage para uploads autenticados
-- Ejecutar si el bucket lo creaste manualmente:
INSERT INTO storage.buckets (id, name, public)
VALUES ('cumple-images', 'cumple-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Upload images for authenticated users" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cumple-images');

CREATE POLICY "Public read access for campaign images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'cumple-images');

CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cumple-images' AND auth.uid()::text = (storage.foldername(name))[2]);

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cumple-images' AND auth.uid()::text = (storage.foldername(name))[2]);
