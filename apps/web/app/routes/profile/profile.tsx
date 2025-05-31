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

  if (!profileUser) {
    return (
      <div className='py-10'>
        <NotFoundCard message='Profile not found' />
      </div>
    );
  }

  const { username, full_name, avatar_url } = profileUser.user;
  const staffRole = activeCompany?.staff_role;

  const isStaff =
    (staffRole === 'su' || staffRole === 'admin') && profileUser.user.userCompanyMatch;

  console.log('******** is profileUser: ', profileUser);
  console.log('******** is activeCompany: ', activeCompany);

  const tabs = [
    {
      to: `/${username}`,
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
  );
}
