import { redirectDocument } from 'react-router';
import { dataWithError } from 'remix-toast';

import { logOut } from '@gonasi/database/auth';

import type { Route } from './+types/signout';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  // Initialize Supabase client with request context
  const { supabase, headers } = createClient(request);

  // Attempt to log out the user
  const { error } = await logOut(supabase);

  // If logout fails, return an error response with a toast message
  if (error) {
    return dataWithError(null, 'Logout failed. Please try again.');
  }

  // Redirect to home page on successful logout, preserving response headers
  return redirectDocument('/', { headers });
}

// Empty component since logout is handled in the loader
export default function SignOut() {
  return null;
}
