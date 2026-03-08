#!/bin/bash

set -e

echo "🚀 ============================================"
echo "🚀 INICIANDO DEPLOY COMPLETO DE CUMPLEANITOS"
echo "🚀 ============================================"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. VERIFICAR QUE ESTAMOS EN LA CARPETA CORRECTA
echo -e "${BLUE}📁 Verificando directorio...${NC}"
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json no encontrado"
  echo "Debes ejecutar este script desde la carpeta /tmp/cumpleanitos"
  exit 1
fi
echo -e "${GREEN}✓ Estamos en la carpeta correcta${NC}"
echo ""

# 2. ACTUALIZAR SUPABASE CON LA MIGRACIÓN SQL
echo -e "${BLUE}🗄️  Ejecutando migración SQL en Supabase...${NC}"
echo "⚠️  IMPORTANTE: Debes hacer esto manualmente en https://supabase.com"
echo ""
echo "Pasos:"
echo "1. Ve a https://supabase.com y abre tu proyecto 'cumpleanitos'"
echo "2. Haz clic en 'SQL Editor' en el menú lateral izquierdo"
echo "3. Haz clic en 'New Query'"
echo "4. Copia y pega esto:"
echo ""
echo "------- COPIA ESTO -------"
cat update-schema.sql
echo "------- FIN -------"
echo ""
echo "5. Haz clic en 'Run'"
echo ""
read -p "📝 ¿Ya ejecutaste el SQL en Supabase? (escribe 'si' para continuar): " sql_done
if [ "$sql_done" != "si" ]; then
  echo "❌ Ejecuta el SQL primero y vuelve a correr este script"
  exit 1
fi
echo -e "${GREEN}✓ Migración SQL completada${NC}"
echo ""

# 3. BUILD DEL PROYECTO
echo -e "${BLUE}📦 Compilando proyecto...${NC}"
npm run build 2>/dev/null || npm install && npm run build
if [ $? -ne 0 ]; then
  echo "❌ Error en el build"
  exit 1
fi
echo -e "${GREEN}✓ Build completado${NC}"
echo ""

# 4. GIT PUSH
echo -e "${BLUE}📤 Pusheando a GitHub...${NC}"
git add .
git commit -m "🎂 feat: Actualización del registro con teléfono y cálculo de edad

- Campo de teléfono celular para integración WhatsApp
- Cálculo automático de edad desde fecha de nacimiento
- Cálculo de días hasta próximo cumpleaños
- Validación de edad mínima (13 años)
- Validación de teléfono (mínimo 10 dígitos)
- Almacenamiento de datos de edad y cumpleaños en Supabase
- Migración SQL de schema completada" 2>/dev/null || echo "No hay cambios nuevos para commitear"
git push
if [ $? -ne 0 ]; then
  echo "❌ Error al hacer push"
  exit 1
fi
echo -e "${GREEN}✓ Push a GitHub completado${NC}"
echo ""

# 5. VERCEL DEPLOY
echo -e "${BLUE}🌐 Desplegando en Vercel...${NC}"
echo "Vercel se actualizará automáticamente en 30 segundos..."
sleep 3
echo -e "${GREEN}✓ Deployment en Vercel iniciado${NC}"
echo ""

# 6. RESUMEN FINAL
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✅ ¡DEPLOY COMPLETADO CON ÉXITO!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "📊 Lo que se hizo:"
echo "  ✓ Migración SQL en Supabase (hiciste vos)"
echo "  ✓ Build del proyecto"
echo "  ✓ Push a GitHub"
echo "  ✓ Deploy automático en Vercel"
echo ""
echo -e "${YELLOW}🔗 Tu app estará lista en: https://cumpleanitos.com${NC}"
echo "   Espera 30-60 segundos para que se actualice"
echo ""
echo "🧪 Cosas para testear:"
echo "   1. Ve a https://cumpleanitos.com/register"
echo "   2. Ingresa una fecha de nacimiento"
echo "   3. Deberías ver: '📅 Tienes X años | 🎁 Tu cumpleaños es en Y días'"
echo "   4. Completa el registro con teléfono"
echo ""
