# 🗄️ Setup Automático de Supabase - Cumpleanitos

Este script automatiza TODAS las migraciones de base de datos para Cumpleanitos.

## ⚡ Uso Rápido

```bash
npm install
node setup-supabase.js
```

## 📋 Qué hace el script

✅ Crea tabla `profile_actions` con todas las columnas
✅ Crea índices para optimizar búsquedas
✅ Crea función de trigger para actualizar timestamps
✅ Valida que todo se creó correctamente
✅ Muestra reporte final

## 🔧 Configuración

### Variables de entorno (opcional)

Si necesitas cambiar la conexión, define estas variables antes de ejecutar:

```bash
export DB_HOST="db.bbhmbnhbzhbyktztdrhu.supabase.co"
export DB_PORT="5432"
export DB_NAME="postgres"
export DB_USER="claude"
export DB_PASSWORD="claude_cumpleanitos_2026"

node setup-supabase.js
```

### Credenciales por defecto

El script viene con credenciales preconfiguradas para el usuario "claude":
- Host: `db.bbhmbnhbzhbyktztdrhu.supabase.co`
- Puerto: `5432`
- Usuario: `claude`
- Contraseña: `claude_cumpleanitos_2026`
- Base de datos: `postgres`

## 📊 Resultado esperado

```
==================================================
🚀 INICIANDO SETUP DE SUPABASE
==================================================

ℹ️  Conectando a la base de datos...
✅ Conectado a Supabase

==================================================
📝 EJECUTANDO MIGRACIONES
==================================================

✅ [1/5] Crear tabla profile_actions
✅ [2/5] Crear índice user_id
✅ [3/5] Crear índice completed
✅ [4/5] Crear función de timestamp
✅ [5/5] Crear trigger de actualización

==================================================
✓ VALIDACIÓN
==================================================

✅ Tabla profile_actions existe
✅ Registros en profile_actions: 0

==================================================
🎉 SETUP COMPLETADO EXITOSAMENTE
==================================================

✅ Todas las migraciones se ejecutaron correctamente
✅ Base de datos lista para producción
```

## 🚨 Solución de problemas

### Error: Cannot find module 'pg'

```bash
npm install pg
node setup-supabase.js
```

### Error: connect ENOTFOUND

Verifica que las credenciales de conexión sean correctas:
```bash
export DB_HOST="tu_host"
export DB_USER="tu_usuario"
export DB_PASSWORD="tu_contraseña"
node setup-supabase.js
```

### Error: permission denied

Asegúrate de que el usuario tiene permisos CREATEDB y CREATE:
```sql
ALTER USER claude WITH CREATEDB;
```

## 📝 Scripts disponibles

```bash
# Setup de BD (migraciones)
npm run setup:db

# Desarrollo
npm run dev

# Build para producción
npm run build
```

## ✅ Verificación manual

Después de ejecutar el script, puedes verificar en Supabase:

1. Ve a **SQL Editor**
2. Ejecuta:
```sql
SELECT * FROM information_schema.tables
WHERE table_name = 'profile_actions';

SELECT COUNT(*) FROM profile_actions;
```

Deberías ver la tabla creada.

---

**Creado para Cumpleanitos 🎂**
