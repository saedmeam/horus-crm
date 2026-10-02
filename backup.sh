#!/bin/bash
# Respaldo automatico de Horustech CRM (base de datos + archivos subidos)
set -e

BACKUP_DIR="/opt/horus-cr/backups"
DB_CONTAINER="horus-db"
DB_USER="${POSTGRES_USER:-horus}"
DB_NAME="${POSTGRES_DB:-horuscrm}"
KEEP=14
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Respaldando base de datos..."
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/db_$DATE.sql"

echo "Respaldando archivos subidos..."
docker cp horus-backend:/app/uploads "$BACKUP_DIR/uploads_$DATE"

echo "Comprimiendo..."
tar czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$BACKUP_DIR" "uploads_$DATE"
rm -rf "$BACKUP_DIR/uploads_$DATE"

ls -1t "$BACKUP_DIR"/db_*.sql 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -f
ls -1t "$BACKUP_DIR"/uploads_*.tar.gz 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -f

echo "Backup completado en $BACKUP_DIR"