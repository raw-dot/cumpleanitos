# Migrations de Base de Datos

Esta carpeta contiene todas las migraciones SQL ejecutadas en Supabase.

## Orden de ejecución:

Las migraciones están nombradas con formato: `YYYY-MM-DD_descripcion.sql`

### Migraciones ejecutadas:

1. `migration-email-core.sql` - Email como campo core (ejecutado ~1 abril 2026)
2. `2026-04-02_fix-google-oauth-trigger.sql` - Fix trigger para crear profiles con Google OAuth

## Cómo ejecutar una migración:

1. Abrí Supabase Dashboard: https://supabase.com/dashboard/project/bbhmbnhbzhbyktztdrhu
2. Ir a **SQL Editor** (panel izquierdo)
3. Click en **New Query**
4. Copiar TODO el contenido del archivo `.sql`
5. Click en **Run**
6. Verificar que no haya errores en el resultado

## Importante:

- ✅ Cada migración debe ejecutarse UNA SOLA VEZ
- ✅ Las migraciones son idempotentes (se pueden re-ejecutar sin romper nada)
- ✅ Siempre hacer backup antes de ejecutar migrations en producción
