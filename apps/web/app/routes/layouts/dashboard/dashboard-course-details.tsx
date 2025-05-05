import { Outlet, redirect } from 'react-router';

import { getUserProfile } from '@gonasi/database/profile';
import { canUserViewCompany } from '@gonasi/database/staffMembers';

import type { Route } from './+types/dashboard-course-details';

import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  if (!user) {
    const redirectTo = new URL(request.url).pathname + new URL(request.url).search;
    return redirect(`/login?${new URLSearchParams({ redirectTo })}`);
  }

  // check access to specified company
  const hasAccess = await canUserViewCompany(supabase, params.companyId ?? '');

  if (!hasAccess) return redirect('dashboard/change-team');

  return { success: true };
}

export default function UpsertCourseLayout() {
  return (
    <section className='container mx-auto'>
      <Outlet />
    </section>
  );
}
