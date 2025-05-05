supabase gen types typescript --local > ../shared/database/src/schema/index.ts

supabase db reset

supabase functions serve --no-verify-jwt
