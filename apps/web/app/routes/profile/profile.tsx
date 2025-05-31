import { NavLink, useOutletContext } from 'react-router';
import { Settings } from 'lucide-react';

import type { Route } from './+types/profile';
import type { ProfileLoaderReturnType } from '../layouts/profile/profile-layout';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
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
              <NavLink to=''>
                <Settings />
              </NavLink>
            ) : null}
          </div>
          <h5 className='py-2 text-sm'>{profileUser.user.full_name}</h5>
        </div>
      </div>
    </div>
  );
}
