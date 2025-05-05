import { redirect, useNavigation } from 'react-router';

import { logOut } from '@gonasi/database/auth';

import type { Route } from './+types/sign-out';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  const { headers, supabase } = createClient(request);

  // sign out
  const { error } = await logOut(supabase);

  if (error) return { error };

  return redirect('/', {
    headers,
  });
}

export default function LogOut() {
  const { state } = useNavigation();
  return <div>{state === 'submitting' ? 'Signing out...' : ''}</div>;
}
