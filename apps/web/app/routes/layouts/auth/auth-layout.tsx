import { data, Outlet, redirect } from 'react-router';

import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/auth-layout';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  return user ? redirect('/go') : data({ success: true });
}

export default function AuthLayout() {
  return (
    <section className='mx-auto mt-0 max-w-lg md:mt-16'>
      <Outlet />
    </section>
  );
}
