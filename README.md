supabase gen types typescript --local > ../shared/database/src/schema/index.ts

supabase db reset

supabase migration up

supabase functions serve --no-verify-jwt

supabase db diff -f some-migration-name

supabase stop && rm -rf migrations && mkdir migrations && cp ../20240619123003_buckets.sql migrations/ cp ../20240619123002_extensions.sql migrations/ && supabase db diff --schema public --schema auth --schema extensions --schema storage -f init && supabase start && supabase db reset && supabase gen types typescript --local > ../shared/database/src/schema/index.ts

set -e
supabase stop && \
rm -rf migrations && \
mkdir migrations && \
cp ../20240619123001_extensions.sql migrations/ && \
cp ../20240619123002_vault.sql migrations/ && \
cp ../20240619123003_buckets.sql migrations/ && \
cp ../20240619123004_queues_and_crons.sql migrations/ && \
supabase db diff --schema public --schema auth --schema extensions --schema storage --schema pgmq --schema realtime -f init && \
supabase start && \
supabase db reset && \
supabase gen types typescript --local > ../shared/database/src/schema/index.ts

supabase db diff --schema public --schema auth --schema extensions --schema storage --schema pgmq --schema realtime -f some_name

supabase test db
