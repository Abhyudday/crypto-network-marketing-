#!/bin/sh
# Manual migration script for production database
# Run this to manually apply migrations to your production database

echo "🔍 Checking current migration status..."
npx prisma migrate status

echo ""
echo "📦 Deploying pending migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Migration deployment complete!"
echo ""
echo "🔍 Final migration status:"
npx prisma migrate status
