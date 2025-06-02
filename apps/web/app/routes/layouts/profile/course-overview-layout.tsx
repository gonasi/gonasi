import { Outlet, redirect } from 'react-router';

import { getUserProfile } from '@gonasi/database/profile';
import { canUserViewCompany } from '@gonasi/database/staffMembers';

import type { Route } from './+types/course-details-layout';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  if (!user) {
    const redirectTo = new URL(request.url).pathname + new URL(request.url).search;
    return redirect(`/login?${new URLSearchParams({ redirectTo })}`);
  }

  // check access to specified company
  const hasAccess = await canUserViewCompany(supabase, params.username ?? '');

  if (!hasAccess) return redirect('/change-team');

  return { success: true };
}

export default function CourseDetailsLayout() {
  return (
    <section className='container mx-auto'>
      <Outlet />
    </section>
  );
}
