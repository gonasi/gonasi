import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

import type { Database } from '@gonasi/database/schema';

import { getServerEnv } from '../../.server/env.server';

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = getServerEnv();

export function createClient(request: Request) {
  const cookies = parseCookieHeader(request.headers.get('Cookie') ?? '');
  const headers = new Headers();

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookies as {
          name: string;
          value: string;
        }[];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          headers.append('Set-Cookie', serializeCookieHeader(name, value, options)),
        );
      },
    },
  });

  return { supabase, headers };
}
