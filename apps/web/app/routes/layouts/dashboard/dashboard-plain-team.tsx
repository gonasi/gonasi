import { data, Outlet, redirect, useOutletContext } from 'react-router';

import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/dashboard-plain-team';

import type { AppOutletContext } from '~/lib/supabase/supabase';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  if (!user) {
    return redirect(
      `/login?${new URLSearchParams({ redirectTo: new URL(request.url).pathname + new URL(request.url).search })}`,
    );
  }

  if (user?.is_onboarding_complete === false) {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;

    return redirect(
      `/onboarding/${user.id}/basic-information?${new URLSearchParams({ redirectTo })}`,
    );
  }

  return data({ success: true });
}

export default function DashboardPlainTeamLayout() {
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  return (
    <section className='mx-auto max-w-lg md:mt-16'>
      <Outlet context={{ user, role, activeCompany }} />
    </section>
  );
}
