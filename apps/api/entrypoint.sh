#!/bin/sh
set -e

echo "🚀 [Slackers API] Starting container entrypoint..."

# Wait for PostgreSQL to be ready
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ [Slackers API] Synchronizing Prisma database schema with PostgreSQL..."
  npx prisma db push --schema prisma/schema.prisma --skip-generate
  echo "✅ [Slackers API] Database schema is in sync!"
fi

# Optional: Seed initial database if SEED_DB is set to true
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 [Slackers API] SEED_DB=true detected. Seeding database..."
  npx tsx src/services/dbSeed.ts || echo "⚠️ Database seed skipped or already populated."
fi

# Execute main process
echo "⚡ [Slackers API] Launching API server..."
exec "$@"
