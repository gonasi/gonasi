import { Outlet } from 'react-router';

import { fetchActiveOrganizationAndMember } from '@gonasi/database/organizations';

import type { Route } from './+types/profile-wrapper-layout';

import { TopNav } from '~/components/navigation/top-nav';
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
      {isActiveUserProfileLoading ? (
        <nav className='border-b-card hidden h-16 w-full animate-pulse items-center border-b md:flex md:h-20 md:px-4' />
      ) : activeUserProfile ? (
        <ProfileTopNav
          user={activeUserProfile}
          organization={loaderData?.organization}
          member={loaderData?.member ?? undefined}
          showBackArrow
          loading={isActiveUserProfileLoading}
        />
      ) : (
        <TopNav user={activeUserProfile} />
      )}

      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
    </div>
  );
}
