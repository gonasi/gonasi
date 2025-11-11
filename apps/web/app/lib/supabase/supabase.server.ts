// ─────────────────────────────────────────────────────────────────
// SUPABASE SERVER CLIENT FACTORY (WITH SUPERPOWERS)
// ─────────────────────────────────────────────────────────────────
// Creates both a normal SSR Supabase client (for user sessions)
// and a service role Supabase client (for admin-level operations).
// Handles cookie parsing/serialization for Remix/Next/Deno requests.
// ─────────────────────────────────────────────────────────────────

import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';

import type { Database } from '@gonasi/database/schema';

import { getServerEnv } from '../../.server/env.server';

// ─────────────────────────────────────────────────────────────
// ENVIRONMENT
// ─────────────────────────────────────────────────────────────
const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

// ─────────────────────────────────────────────────────────────
// CREATE SUPERPOWERED CLIENT
// ─────────────────────────────────────────────────────────────
export function createClient(request: Request) {
  const cookies = parseCookieHeader(request.headers.get('Cookie') ?? '');
  const headers = new Headers();

  // Authenticated SSR client (safe for use with cookies)
  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookies as { name: string; value: string }[];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          headers.append('Set-Cookie', serializeCookieHeader(name, value, options)),
        );
      },
    },
  });

  // Full-power admin client (⚠️ uses service key)
  const supabaseAdmin = createServiceClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  return { supabase, supabaseAdmin, headers };
}

// ─────────────────────────────────────────────────────────────
// OPTIONAL: DEFAULT EXPORT (SHORTCUT)
// ─────────────────────────────────────────────────────────────
export default createClient;
