import { NavLink, Outlet, useOutletContext } from 'react-router';
import { Files, Library, Settings, UsersRound } from 'lucide-react';

import { getProfileByUsername } from '@gonasi/database/profiles';

import type { Route } from './+types/profile-layout';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoTabNav } from '~/components/go-tab-nav';
import { createClient } from '~/lib/supabase/supabase.server';
import type { AppOutletContext } from '~/root';

export type ProfileLoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const profileUser = await getProfileByUsername({
    supabase,
    username: params.username ?? '',
  });

  return profileUser;
}

export default function ProfileLayout({ loaderData: profileUser }: Route.ComponentProps) {
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  if (!profileUser) return <NotFoundCard message='Profile not found' />;

  const { username, full_name, avatar_url } = profileUser.user;
  const staffRole = activeCompany?.staff_role;

  const isStaff =
    (staffRole === 'su' || staffRole === 'admin') && profileUser.user.userCompanyMatch;

  const tabs = [
    {
      to: `/${username}/courses`,
      name: 'Courses',
      icon: Library,
      isVisible: true,
    },
    {
      to: `${username}/file-library`,
      name: 'Files',
      icon: Files,
      isVisible: isStaff,
    },
    {
      to: `${username}/team-management`,
      name: 'Team',
      icon: UsersRound,
      isVisible: isStaff,
    },
  ];

  return (
    <section className='mx-auto max-w-2xl px-4 py-10'>
      <div>
        <div className='flex w-full space-x-4'>
          <PlainAvatar username={username} imageUrl={avatar_url} size='xl' />
          <div className='w-full'>
            <div className='flex w-full justify-between'>
              <h4 className='font-secondary'>{username}</h4>
              {staffRole === 'su' && (
                <NavLink to='' className='group'>
                  <Settings className='transition-transform duration-200 group-hover:scale-105 group-hover:rotate-15' />
                </NavLink>
              )}
            </div>
            <h5 className='py-2 text-sm'>{full_name}</h5>
          </div>
        </div>

        <section className='h-full'>
          <div className='bg-background/95 sticky -top-10 z-10'>
            <GoTabNav tabs={tabs} />
          </div>
          <div className='mt-4 md:mt-8'>
            <Outlet context={{ user, role, activeCompany }} />
          </div>
        </section>
      </div>
    </section>
  );
}
