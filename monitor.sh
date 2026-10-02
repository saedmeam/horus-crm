#!/bin/bash
# Monitoreo de Horustech CRM: verifica contenedores y salud del backend
for c in horus-db horus-backend horus-frontend; do
  if ! docker ps --format '{{.Names}}' | grep -q "^${c}$"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERTA: contenedor $c caido" >> /var/log/horus-monitor.log
  fi
done
if ! curl -s http://localhost:4001/health | grep -q '"ok"'; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERTA: backend no responde en /health" >> /var/log/horus-monitor.log
fi