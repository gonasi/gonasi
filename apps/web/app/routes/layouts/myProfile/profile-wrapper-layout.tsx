import { Outlet } from 'react-router';

import { fetchActiveOrganizationAndMember } from '@gonasi/database/organizations';

import type { Route } from './+types/profile-wrapper-layout';

import { ProfileTopNav } from '~/components/navigation/top-nav/profile-top-nav';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const data = await fetchActiveOrganizationAndMember(supabase);

  return data; // shape: { organization, member } | null
}

export default function ProfileWrapperLayout({ loaderData }: Route.ComponentProps) {
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();

  return (
    <div>
      <ProfileTopNav
        user={activeUserProfile}
        organization={loaderData?.organization}
        member={loaderData?.member ?? undefined}
        showBackArrow
        loading={isActiveUserProfileLoading}
      />
      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
    </div>
  );
}
