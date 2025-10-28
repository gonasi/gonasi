import { SeedPostgres } from '@snaplet/seed/adapter-postgres';
import { defineConfig } from '@snaplet/seed/config';
import postgres from 'postgres';

export default defineConfig({
  adapter: () => {
    // Connect to your local Supabase Postgres instance
    const client = postgres('postgresql://postgres:postgres@127.0.0.1:54322/postgres');
    return new SeedPostgres(client);
  },
  alias: {
    // Use inflected names for fields (camelCase)
    inflection: true,
  },
  select: [
    // Exclude everything by default
    '!*',

    // Include only your app schema
    'public*',

    // Include essential auth tables (safe ones)
    'auth.users',
    'auth.identities',

    // Explicitly exclude problematic or system tables
    '!auth.sessions',
    '!auth.oauth_clients',
    '!auth.refresh_tokens',
    '!auth.mfa_factors',

    // Exclude internal extension-owned tables
    '!extensions*',
    '!storage*',

    // Exclude specific app tables you don’t want seeded
    '!public.role_permissions',
  ],
});
