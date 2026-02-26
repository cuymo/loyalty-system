#!/bin/sh
# scripts/start.sh
# Entrypoint de produccion para Docker.
# Sincroniza el esquema de BD y crea el admin inicial, luego arranca la app.

set -e

echo "==> [1/3] Sincronizando esquema de base de datos..."
npx drizzle-kit push || echo "WARN: drizzle-kit push falló (puede ser normal si ya está sincronizada)"

echo "==> [2/3] Ejecutando seed inicial (crea admin si no existe)..."
npx tsx src/db/seed.ts || echo "WARN: seed falló (puede ser normal si el admin ya existe)"

echo "==> [3/3] Iniciando Next.js..."
exec node server.js
