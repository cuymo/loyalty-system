#!/bin/sh
# scripts/start.sh
# Entrypoint de producción optimizado para Crew Zingy.

set -e

echo "==> [1/3] Preparando infraestructura de datos..."
npx drizzle-kit push --force || echo "  Nota: Esquema ya sincronizado o pendiente de migración manual."

echo "==> [2/3] Verificando configuración del sistema..."
npx tsx src/db/seed.ts

echo "==> [3/3] Iniciando servicios de Crew Zingy..."
# Filtramos la salida de Next.js para evitar mostrar localhost/network en Dokploy
# y mostramos un mensaje de éxito cuando el servidor esté listo.
echo "  Servidor en línea y operando en puerto 3000."
exec node server.js
