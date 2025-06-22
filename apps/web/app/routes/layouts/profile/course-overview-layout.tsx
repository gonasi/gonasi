import { Outlet, redirect } from 'react-router';
import { redirectWithError } from 'remix-toast';

import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/course-overview-layout';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  if (!user) {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    return redirect(`/login?${new URLSearchParams({ redirectTo })}`);
  }

  // TODO: Implement proper permission checking
  if (user.username !== params.username) {
    return redirectWithError(`/${params.username}`, `You don’t have permission to view this page.`);
  }

  return { success: true };
}

export default function CourseDetailsLayout() {
  return (
    <section className='container mx-auto'>
      <Outlet />
    </section>
  );
}
