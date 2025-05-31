import { NavLink, Outlet, useOutletContext } from 'react-router';
import { Files, Library, Settings, UsersRound } from 'lucide-react';

import type { Route } from './+types/profile';
import type { ProfileLoaderReturnType } from '../layouts/profile/profile-layout';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoTabNav } from '~/components/go-tab-nav';
import type { AppOutletContext } from '~/root';

export function meta() {
  return [
    {
      title: 'Gonasi - Interactive Course Builder',
    },
    {
      name: 'description',
      content:
        'Build and manage interactive online courses with Gonasi — the modern, user-friendly course builder platform.',
    },
  ];
}

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export default function Profile() {
  const { user, role, activeCompany, profileUser } = useOutletContext<
    AppOutletContext & { profileUser: ProfileLoaderReturnType }
  >();

  if (!profileUser)
    return (
      <div className='py-10'>
        <NotFoundCard message='Profile not found' />
      </div>
    );

  return (
    <div className=''>
      <div className='flex w-full space-x-4'>
        <PlainAvatar
          username={profileUser.user.username}
          imageUrl={profileUser.user.avatar_url}
          size='xl'
        />
        <div className='w-full'>
          <div className='flex w-full justify-between'>
            <h4 className='font-secondary'>{profileUser.user.username}</h4>
            {activeCompany?.staff_role === 'su' ? (
              <NavLink to='' className='group'>
                <Settings className='transition-transform duration-200 group-hover:scale-105 group-hover:rotate-15' />
              </NavLink>
            ) : null}
          </div>
          <h5 className='py-2 text-sm'>{profileUser.user.full_name}</h5>
        </div>
      </div>
      <section className='h-full'>
        {/* Sticky tab navigation */}
        <div className='bg-background/95 sticky -top-10 z-10'>
          <GoTabNav
            tabs={[
              {
                to: `/${profileUser.user.username}`,
                name: 'Courses',
                icon: Library,
              },
              {
                to: `${profileUser.user.username}/file-library`,
                name: 'Files',
                icon: Files,
              },
              {
                to: `${profileUser.user.username}/team-management`,
                name: 'Team',
                icon: UsersRound,
              },
            ]}
          />
        </div>
        {/* Main content */}
        <div className='mt-4 md:mt-8'>
          <Outlet context={{ user, role, activeCompany }} />
        </div>
      </section>
    </div>
  );
}
