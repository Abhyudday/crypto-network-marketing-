#!/bin/sh
set -e

echo "🔧 Setting up database..."

# Try migrate deploy first
if npx prisma migrate deploy 2>/dev/null; then
  echo "✅ Migrations applied successfully"
else
  echo "⚠️  Migrations failed, trying db push..."
  npx prisma db push --accept-data-loss --skip-generate
  echo "✅ Database schema pushed"
fi

echo "🚀 Starting server..."
npm start
