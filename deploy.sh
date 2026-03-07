#!/bin/bash

echo "🚀 Iniciando deploy automático de Cumpleanitos..."

# 1. Build
echo "📦 Compilando proyecto..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Error en el build"
  exit 1
fi

# 2. Git push
echo "📤 Pusheando a GitHub..."
git add .
git commit -m "Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push

if [ $? -eq 0 ]; then
  echo "✅ Deploy completado. Vercel está actualizando..."
  echo "🌐 Visitá https://cumpleanitos.com en 30 segundos"
else
  echo "❌ Error al pushear"
  exit 1
fi
