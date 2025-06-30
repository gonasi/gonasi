import { Outlet, useLocation } from 'react-router';
import { BookOpenCheck, History, Settings } from 'lucide-react';

import { getProfileByUsername } from '@gonasi/database/profiles';

import type { Route } from './+types/my-profile-layout';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoTabNav } from '~/components/go-tab-nav';
import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

export type ProfileLoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export function meta({ data }: Route.MetaArgs) {
  const user = (data as ProfileLoaderReturnType | null)?.profileUser?.user;

  if (!user) {
    return [
      { title: 'User Not Found • Gonasi' },
      { name: 'description', content: 'This profile could not be found on Gonasi.' },
    ];
  }

  const { username, full_name } = user;
  const displayName = full_name || username;

  return [
    { title: `${displayName} • Profile on Gonasi` },
    {
      name: 'description',
      content: `View ${displayName}'s public profile, including learning history and active courses.`,
    },
  ];
}

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

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

  const { username, full_name, signed_url, isMyProfile } = profileUser.user;

  const tabs = [
    {
      to: `/go/${username}`,
      name: 'Learning',
      icon: BookOpenCheck,
      isVisible: true,
    },
    {
      to: `/go/${username}/history`,
      name: 'History',
      icon: History,
      isVisible: true,
    },
  ];

  return (
    <section className='mx-auto max-w-4xl py-10'>
      <div className='flex w-full space-x-4 px-4'>
        <PlainAvatar username={username} imageUrl={signed_url} size='lg' />
        <div className='w-full'>
          <div className='flex w-full justify-between'>
            <h4 className='font-secondary'>{username}</h4>
            {isMyProfile && (
              <IconNavLink
                to={`/go/${params.username}/settings/profile-information?${new URLSearchParams({ redirectTo })}`}
                icon={Settings}
              />
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
