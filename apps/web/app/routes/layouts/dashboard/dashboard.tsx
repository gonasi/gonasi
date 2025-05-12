import { data, Outlet, redirect, useOutletContext } from 'react-router';

import { getUserProfile } from '@gonasi/database/profile';
import { canUserViewCompany } from '@gonasi/database/staffMembers';

import type { Route } from './+types/dashboard';

import { GoDashboardLayout } from '~/components/layouts/dashboard';
import { createClient } from '~/lib/supabase/supabase.server';
import type { AppOutletContext } from '~/root';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
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

  // check access to specified company
  const hasAccess = await canUserViewCompany(supabase, params.companyId ?? '');

  if (!hasAccess) return redirect('dashboard/change-team');

  return data({ success: true });
}

export default function DashboardLayout() {
  const { user, role, activeCompany, session } = useOutletContext<AppOutletContext>();

  return (
    <>
      <GoDashboardLayout user={user} role={role} activeCompany={activeCompany}>
        <Outlet context={{ user, role, activeCompany, session }} />
      </GoDashboardLayout>
    </>
  );
}
