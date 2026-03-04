#!/bin/sh
set -e
echo "Running Prisma migrate..."
npx prisma migrate deploy
echo "Starting Node..."
exec node run.js
