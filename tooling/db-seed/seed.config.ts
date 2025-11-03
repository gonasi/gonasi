import { SeedPostgres } from '@snaplet/seed/adapter-postgres';
import { defineConfig } from '@snaplet/seed/config';
import postgres from 'postgres';

export default defineConfig({
  adapter: () => {
    const client = postgres('postgresql://postgres:postgres@127.0.0.1:54322/postgres');
    return new SeedPostgres(client);
  },
  alias: { inflection: true },
  select: [
    '!*',
    'public*',
    'auth.users',
    'auth.identities',

    '!auth.sessions',
    '!auth.oauth_clients',
    '!auth.refresh_tokens',
    '!auth.mfa_factors',
    '!extensions*',
    '!storage*',
    '!pgmq_public*',
    '!graphql_public*',
    '!public.role_permissions',

    // 👇 explicitly exclude problematic schemas
    '!pgmq_public*',
    '!graphql_public*',
  ],
});
