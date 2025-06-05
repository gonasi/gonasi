import { Outlet, redirect } from 'react-router';

import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/course-overview-layout';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  if (!user) {
    const redirectTo = new URL(request.url).pathname + new URL(request.url).search;
    return redirect(`/login?${new URLSearchParams({ redirectTo })}`);
  }

  // TODO: Check if user has permissions for builder

  return { success: true };
}

export default function CourseDetailsLayout() {
  return (
    <section className='container mx-auto'>
      <Outlet />
    </section>
  );
}
