#!/usr/bin/env bash
# ============================================================
# Script para apuntar a la BD del servidor y compilar ahí.
# Uso:
#   1) cp .env.server.example .env.server  y edita los valores reales.
#   2) chmod +x deploy-server.sh
#   3) ./deploy-server.sh
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.server"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: no existe $ENV_FILE. Cópialo desde .env.server.example y edítalo." >&2
  exit 1
fi

# Cargar variables del archivo .env.server
set -a
source "$ENV_FILE"
set +a

echo ">>> Aplicando schema Prisma a la BD remota (db push)..."
cd "$SCRIPT_DIR/backend"
npx prisma db push
npx prisma generate

echo ">>> Verificando compilación del backend (tsc)..."
npx tsc --noEmit

echo ">>> Compilando frontend (build)..."
cd "$SCRIPT_DIR/frontend"
npm run build

echo ">>> LISTO. Schema aplicado y builds compilados contra el servidor."
