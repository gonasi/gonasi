supabase gen types typescript --local > ../shared/database/src/schema/index.ts

supabase db reset

supabase migration up

supabase functions serve --no-verify-jwt

supabase db diff -f some-migration-name

rm -rf migrations && supabase stop && supabase db diff --schema public --schema auth --schema extensions --schema storage -f init && supabase start && supabase db reset

supabase db diff --schema public --schema auth --schema extensions --schema storage -f init

supabase test db
