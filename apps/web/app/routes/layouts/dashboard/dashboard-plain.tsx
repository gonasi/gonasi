import { data, Outlet, redirect } from 'react-router';

import { canUserViewCompany } from '@gonasi/database/staffMembers';

import type { Route } from './+types/dashboard-plain';

import { Spinner } from '~/components/loaders';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // check access to specified company
  const hasAccess = await canUserViewCompany(supabase, params.companyId ?? '');

  if (!hasAccess) return redirect('dashboard/change-team');

  return data({ success: true });
}

export default function DashboardPlainLayout() {
  const { isLoading } = useAuthGuard();

  if (isLoading) return <Spinner />;
  return (
    <section className='mx-auto max-w-lg md:mt-16'>
      <Outlet />
    </section>
  );
}
