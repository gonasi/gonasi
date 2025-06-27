import { Pencil } from 'lucide-react';

import { getMyOwnProfile } from '@gonasi/database/profiles';

import type { Route } from './+types/profile-information';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

export type ProfileLoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export function meta({ data }: Route.MetaArgs) {
  const user = (data as ProfileLoaderReturnType | null)?.profileUser;

  if (!user) {
    return [
      { title: 'User Not Found • Gonasi' },
      { name: 'description', content: 'The user profile could not be loaded.' },
    ];
  }

  const { username, full_name } = user;
  const displayName = full_name || username;

  return [
    { title: `${displayName} • Edit Profile Settings • Gonasi` },
    {
      name: 'description',
      content: `Update ${displayName}'s profile settings including name, avatar, and visibility preferences.`,
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const profileUser = await getMyOwnProfile(supabase);

  return { profileUser };
}

export default function ProfileInformationSettings({ loaderData }: Route.ComponentProps) {
  if (!loaderData) return <NotFoundCard message='Profile not found' />;
  return (
    <div className='w-full'>
      <div className='flex w-full flex-col items-center space-y-8 space-x-0 p-0 md:flex-row md:space-y-0 md:space-x-8'>
        <div className=''>
          <div className='relative'>
            <PlainAvatar
              username={loaderData.profileUser?.username ?? ''}
              imageUrl={loaderData.profileUser?.avatar_url}
              size='xl'
            />
            <IconNavLink
              to='/back'
              icon={Pencil}
              className='bg-card border-background absolute -top-2 -right-2 rounded-full border-2 p-2'
              size={12}
            />
          </div>
        </div>
        <div className='md:bg-card/50 flex w-full justify-between rounded-lg bg-transparent p-0 md:p-4'>
          <div>
            <h4>{loaderData.profileUser?.username}</h4>
            <h5 className='font-secondary text-sm'>{loaderData.profileUser?.full_name}</h5>
            <p className='text-muted-foreground font-secondary text-xs'>
              {loaderData.profileUser?.email}
            </p>
          </div>
          <div>
            <IconNavLink to='/back' icon={Pencil} className='bg-card rounded-full p-2' size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
