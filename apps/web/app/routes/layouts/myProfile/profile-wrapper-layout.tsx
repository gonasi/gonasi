import { Outlet } from 'react-router';

import { fetchUsersActiveOrganization } from '@gonasi/database/organizations';

import type { Route } from './+types/profile-wrapper-layout';

import { ProfileTopNav } from '~/components/navigation/top-nav/profile-top-nav';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const activeOrganization = await fetchUsersActiveOrganization(supabase);

  return activeOrganization;
}

export default function ProfileWrapperLayout({ loaderData }: Route.ComponentProps) {
  const { activeUserProfile } = useStore();

  return (
    <div>
      <ProfileTopNav user={activeUserProfile} organization={loaderData ?? undefined} />
      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
    </div>
  );
}
