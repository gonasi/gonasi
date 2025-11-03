import { Outlet, redirect } from 'react-router';

import { getUserRole } from '@gonasi/database/auth';
import { isGoSuOrGoAdminOrGoStaff } from '@gonasi/utils/roleFunctions';

import type { Route } from './+types/gonasi-layout';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const userRole = await getUserRole(supabase);

  const isGonasi = isGoSuOrGoAdminOrGoStaff(userRole);

  if (!isGonasi) {
    return redirect('/');
  }

  return userRole;
}

export default function GonasiLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
    </div>
  );
}
