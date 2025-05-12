// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

import type { UserActiveSessionLoaderReturnType } from '~/root';

export const createBrowserClient = (accessToken: UserActiveSessionLoaderReturnType) => {
  return createClient(
    import.meta.env.VITE_PUBLIC_SUPABASE_URL,
    import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken.access_token}`,
            }
          : {},
      },
    },
  );
};
