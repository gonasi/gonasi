// import { createClient } from '@supabase/supabase-js';

// import type { Database } from '@gonasi/database/schema';

// import type { UserActiveSessionLoaderReturnType } from '~/root';

// // Store the client instance
// let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;
// let currentAccessToken: string | null = null;

// export const createBrowserClient = (accessToken: UserActiveSessionLoaderReturnType) => {
//   const newAccessToken = accessToken?.access_token || null;

//   // If the access token has changed, we need to create a new client
//   if (newAccessToken !== currentAccessToken || !supabaseClient) {
//     currentAccessToken = newAccessToken;

//     supabaseClient = createClient<Database>(
//       import.meta.env.VITE_PUBLIC_SUPABASE_URL,
//       import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
//       {
//         global: {
//           headers: accessToken
//             ? {
//                 Authorization: `Bearer ${newAccessToken}`,
//               }
//             : {},
//         },
//         auth: {
//           storageKey: 'supabase_auth_token',
//           persistSession: true,
//         },
//       },
//     );
//   }

//   return supabaseClient;
// };

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
  );
}
