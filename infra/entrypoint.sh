#!/bin/sh
set -e

echo "==> Rodando migrações do banco..."
npx prisma migrate deploy

echo "==> Iniciando aplicação..."
exec node server.js
