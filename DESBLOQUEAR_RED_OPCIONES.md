# 🌐 Opciones para Ejecutar SQLs Automáticamente

## Problema Actual
- Sandbox de Claude bloquea conexiones salientes a Supabase
- No puedo ejecutar SQLs directamente via curl/fetch
- Tenés que ejecutarlos manualmente cada vez

---

## ✅ Solución 1: GitHub Actions (RECOMENDADA)

**Pros:** Automático, seguro, versionado
**Contras:** Requiere setup inicial de 5 min

### Setup:
1. **Agregar Secret en GitHub:**
   - Ir a: https://github.com/raw-dot/cumpleanitos/settings/secrets/actions
   - Click "New repository secret"
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiaG1ibmhiemhieWt0enRkcmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgyODc5OCwiZXhwIjoyMDg4NDA0Nzk4fQ.P4aRPrpFEqf1cBre4BlAUPgFzxjYlLfiSp613awDLC8`

2. **Ya tenemos el workflow creado:** `.github/workflows/execute-sql.yml`

3. **Ejecutar:**
   - Ir a: https://github.com/raw-dot/cumpleanitos/actions
   - Click "Execute SQL Migration"
   - Click "Run workflow"
   - Seleccionar el archivo SQL
   - Run

**Desde ahora:** Yo pusheo el SQL al repo, vos clickeás "Run workflow" y listo.

---

## ✅ Solución 2: Vercel Edge Function

**Pros:** HTTP endpoint simple, siempre disponible
**Contras:** Expone endpoint público (necesita auth)

### Implementación:
```javascript
// /api/execute-sql.js (Vercel Serverless)
export default async function handler(req, res) {
  // Validar secret key
  if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { sql } = req.body;
  
  const response = await fetch('https://bbhmbnhbzhbyktztdrhu.supabase.co/rest/v1/rpc/exec_sql', {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  return res.json(await response.json());
}
```

**Uso:**
```bash
curl https://cumpleanitos.com/api/execute-sql \
  -H "x-admin-key: SECRET" \
  -d '{"sql":"ALTER TABLE..."}'
```

---

## ✅ Solución 3: Supabase Edge Functions

**Pros:** Nativo de Supabase, muy seguro
**Contras:** Requiere Supabase CLI

### Setup:
```bash
# Crear función
supabase functions new execute-migration

# Deployar
supabase functions deploy execute-migration --project-ref bbhmbnhbzhbyktztdrhu
```

---

## ✅ Solución 4: npm script local (temporal)

**Pros:** Rápido para testing
**Contras:** Solo funciona en tu máquina

### Implementación:
```javascript
// scripts/run-migration.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://bbhmbnhbzhbyktztdrhu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = fs.readFileSync(process.argv[2], 'utf8');
const { error } = await supabase.rpc('exec_sql', { query: sql });

if (error) console.error(error);
else console.log('✅ Migration executed');
```

**Uso:**
```bash
SUPABASE_SERVICE_ROLE_KEY=xxx npm run migrate migrations/xxx.sql
```

---

## 🎯 Mi Recomendación

**Para vos:** Solución 1 (GitHub Actions)
- Ya está el workflow creado
- Solo necesitás agregar el secret una vez
- Después es 3 clicks para ejecutar cualquier SQL

**Para mí (Claude):** Solución 2 (Vercel Edge Function)
- Puedo llamarla con curl desde el sandbox
- Vos configurás el endpoint una vez
- Yo lo uso automáticamente cada vez

---

## 📋 Próximos pasos

1. **Configurar GitHub Secret** (5 min, una sola vez)
2. **Probar workflow** con el SQL de deleted_at
3. **Opcional:** Crear Vercel Edge Function para automation completa

¿Querés que implemente la Solución 2 (Vercel Edge Function) para que yo pueda ejecutar SQLs automáticamente?
