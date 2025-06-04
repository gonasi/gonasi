import { NavLink, Outlet } from 'react-router';
import { BookCopy, Files, Library, Settings } from 'lucide-react';

import { getProfileByUsername } from '@gonasi/database/profiles';

import type { Route } from './+types/profile-layout';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoTabNav } from '~/components/go-tab-nav';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

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

export default function ProfileLayout({ loaderData }: Route.ComponentProps) {
  const { activeUserProfile } = useStore();

  const { profileUser } = loaderData;

  if (!profileUser) {
    return <NotFoundCard message='Profile not found' />;
  }

  const { username, full_name, avatar_url } = profileUser.user;

  const isMyProfile = activeUserProfile?.username === username;

  const tabs = [
    { to: `/${username}`, name: 'Courses', icon: BookCopy, isVisible: true },
    { to: `/${username}/pathways`, name: 'Pathways', icon: Library, isVisible: true },
    { to: `/${username}/file-library`, name: 'Files', icon: Files, isVisible: isMyProfile },
  ];

  return (
    <section className='mx-auto max-w-4xl py-10'>
      <div className='flex w-full space-x-4 px-4'>
        <PlainAvatar username={username} imageUrl={avatar_url} size='lg' />
        <div className='w-full'>
          <div className='flex w-full justify-between'>
            <h4 className='font-secondary'>{username}</h4>
            {isMyProfile && (
              <NavLink to='' className='group'>
                <Settings className='transition-transform duration-200 group-hover:scale-105 group-hover:rotate-15' />
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
        <Outlet />
      </div>
    </section>
  );
}
