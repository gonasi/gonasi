import { useOutletContext } from 'react-router';

import type { Route } from './+types/profile';
import type { ProfileLoaderReturnType } from '../layouts/profile/profile-layout';

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
    <div>
      <h1>profile</h1>
      <div>{profileUser.user.full_name}</div>
    </div>
  );
}
