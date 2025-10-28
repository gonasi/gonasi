import { createClient } from '@supabase/supabase-js';
import { ENV } from '@shared/env.ts';

// ⚙️ Admin client (uses the service role key)
//   - Full access for backend logic like queue processing, background jobs, etc.
export const supabaseAdmin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ⚙️ User-scoped client (optional)
//   - For cases where you need to act as the user who triggered a webhook or request
//   - Example: verifying RLS-accessible data in functions
export function createUserClient(accessToken: string) {
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
