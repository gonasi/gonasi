import { redirect } from 'react-router';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

import type { Route } from './+types/callback';

import { getServerEnv } from '~/.server/env.server';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = getServerEnv();

export async function loader({ request }: Route.LoaderArgs) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const headers = new Headers();
  const cookies = parseCookieHeader(request.headers.get('Cookie') ?? '');

  if (code) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append('Set-Cookie', serializeCookieHeader(name, value, options)),
          );
        },
      },
    });

    try {
      // This will automatically handle the PKCE flow if the code verifier is stored in cookies
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log('Auth exchange result:', { data, error });

      if (!error && data.session) {
        return redirect(next, { headers });
      }

      if (error) {
        console.error('Auth exchange error:', error);
        return redirect(`/auth/v1/auth-code-error?error=${encodeURIComponent(error.message)}`, {
          headers,
        });
      }
    } catch (err) {
      console.error('Unexpected error during auth exchange:', err);
      return redirect('/auth/v1/auth-code-error?error=unexpected_error', { headers });
    }
  }

  // return the user to an error page with instructions
  return redirect('/auth/v1/auth-code-error?error=missing_code', { headers });
}
