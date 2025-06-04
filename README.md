supabase gen types typescript --local > ../shared/database/src/schema/index.ts

supabase db reset

supabase migration up

supabase functions serve --no-verify-jwt

supabase db diff -f some-migration-name

rm -rf migrations && supabase db reset && supabase stop && supabase db diff -f init && supabase start && supabase db reset

supabase test db
