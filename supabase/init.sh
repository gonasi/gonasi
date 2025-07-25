#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Stop Supabase
echo "Stopping Supabase..."
supabase stop

# Reset migrations directory
echo "Resetting migrations directory..."
rm -rf migrations
mkdir migrations

# Copy base schema
echo "Copying initial migration..."
cp ../20240619123002_extensions.sql migrations/
cp ../20240619123003_buckets.sql migrations/
cp ../20240619123004_queues_and_crons.sql migrations/

# Generate migration diff
echo "Creating migration diff..."
supabase db diff --schema public --schema auth --schema extensions --schema storage --schema pgmq -f init

# Start Supabase
echo "Starting Supabase..."
supabase start

# Reset database
echo "Resetting database..."
supabase db reset

# Generate TypeScript types
echo "Generating TypeScript types..."
supabase gen types typescript --local > ../shared/database/src/schema/index.ts

echo "Done."
