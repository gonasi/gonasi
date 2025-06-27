import { NavLink, Outlet, useLocation } from 'react-router';
import { BookCopy, FileStack } from 'lucide-react';

import { getProfileByUsername } from '@gonasi/database/profiles';

import type { Route } from './+types/my-profile-layout';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoTabNav } from '~/components/go-tab-nav';
import { SettingsNotificationsIcon } from '~/components/icons';
import { createClient } from '~/lib/supabase/supabase.server';

export type ProfileLoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // Don't await - return the promise for deferred loading
  const profileUser = await getProfileByUsername({
    supabase,
    username: params.username ?? '',
  });

  return { profileUser };
}

export default function ProfileLayout({ loaderData, params }: Route.ComponentProps) {
  const { profileUser } = loaderData;

  const location = useLocation();

  const redirectTo = location.pathname + location.search;

  if (!profileUser) {
    return <NotFoundCard message='Profile not found' />;
  }

  const { username, full_name, avatar_url, isMyProfile } = profileUser.user;

  const tabs = [
    {
      to: `/go/go/${username}`,
      name: 'Active',
      icon: BookCopy,
      isVisible: true,
    },
    {
      to: `/go/go/${username}/history`,
      name: 'History',
      icon: FileStack,
      isVisible: true,
    },
  ];

  return (
    <section className='mx-auto max-w-4xl py-10'>
      <div className='flex w-full space-x-4 px-4'>
        <PlainAvatar username={username} imageUrl={avatar_url} size='lg' />
        <div className='w-full'>
          <div className='flex w-full justify-between'>
            <h4 className='font-secondary'>{username}</h4>
            {isMyProfile && (
              <NavLink
                to={`/${params.username}/settings/profile-information?${new URLSearchParams({ redirectTo })}`}
                className='group'
              >
                <SettingsNotificationsIcon hasNotifications />
              </NavLink>
            )}
          </div>
          <h5 className='py-2 text-sm'>{full_name}</h5>
        </div>
      </div>
      <div className='bg-background/95 sticky -top-2 z-10'>
        <GoTabNav tabs={tabs} />
      </div>
      <div className='mt-0 md:mt-8'>
        <Outlet context={{ isMyProfile }} />
      </div>
    </section>
  );
}
