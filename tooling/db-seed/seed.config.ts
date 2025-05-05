import { SeedPostgres } from '@snaplet/seed/adapter-postgres';
import { defineConfig } from '@snaplet/seed/config';
import postgres from 'postgres';

export default defineConfig({
  adapter: () => {
    const client = postgres('postgresql://postgres:postgres@127.0.0.1:54322/postgres');
    return new SeedPostgres(client);
  },
  alias: {
    // We want inflections name on our fields see: https://docs.snaplet.dev/seed/core-concepts#inflection
    inflection: true,
  },
  select: [
    // We don't alter any extensions tables that might be owned by extensions
    '!*',
    // We want to alter all the tables under public schema
    'public*',
    // We also want to alter some of the tables under the auth schema
    'auth.users',
    'auth.identities',
    'auth.sessions',
    '!public.role_permissions',
  ],
});
