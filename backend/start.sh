#!/bin/bash

echo "Starting Crypto MLM Backend..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed level bonus configuration if not already seeded
echo "Checking system configuration..."
npx ts-node src/scripts/seed-level-bonuses.ts || echo "Config already seeded or seed script not needed"

# Start the application
echo "Starting Node.js server..."
node dist/server.js
