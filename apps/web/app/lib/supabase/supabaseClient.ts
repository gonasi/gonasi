import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@gonasi/database/schema';

export const supabaseClient = createBrowserClient<Database>(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL!,
  import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
