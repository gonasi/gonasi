import { Outlet } from 'react-router';

import { getUserRole } from '@gonasi/database/auth';
import { fetchActiveOrganizationAndMember } from '@gonasi/database/organizations';

import type { Route } from './+types/profile-wrapper-layout';

import { TopNav } from '~/components/navigation/top-nav';
import { PersonalTopNav } from '~/components/navigation/top-nav/personal-top-nav';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [data, userRole] = await Promise.all([
    fetchActiveOrganizationAndMember(supabase),
    getUserRole(supabase),
  ]);

  return { data, userRole }; // shape: { organization, member } | null
}

export default function ProfileWrapperLayout({ loaderData }: Route.ComponentProps) {
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();

  return (
    <div>
      {isActiveUserProfileLoading ? (
        <nav className='border-b-card hidden h-16 w-full animate-pulse items-center border-b md:flex md:h-20 md:px-4' />
      ) : activeUserProfile ? (
        <PersonalTopNav user={activeUserProfile} userRole={loaderData.userRole} showBackArrow />
      ) : (
        <TopNav user={activeUserProfile} userRole={loaderData.userRole} />
      )}

      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
    </div>
  );
}
