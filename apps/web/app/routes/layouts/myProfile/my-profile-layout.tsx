import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BookOpenCheck, History, Info, Settings } from 'lucide-react';

import { switchToPersonalMode } from '@gonasi/database/organizations';
import { getProfileByUsername } from '@gonasi/database/profiles';

import type { Route } from './+types/my-profile-layout';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoTabNav } from '~/components/go-tab-nav';
import { Button, IconNavLink } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
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

  const [profileUser, personalMode] = await Promise.all([
    getProfileByUsername({
      supabase,
      username: params.username ?? '',
    }),
    switchToPersonalMode({ supabase }),
  ]);

  return { profileUser, personalMode };
}

export default function ProfileLayout({ loaderData, params }: Route.ComponentProps) {
  const { profileUser: profileRecord, personalMode: personalModeResult } = loaderData;

  const { success: didSwitchToPersonalMode } = personalModeResult;

  const location = useLocation();
  const redirectTo = location.pathname + location.search;

  // Modal state
  const [showPersonalModeModal, setShowPersonalModeModal] = useState(!!didSwitchToPersonalMode);

  useEffect(() => {
    if (didSwitchToPersonalMode) {
      setShowPersonalModeModal(true);
    }
  }, [didSwitchToPersonalMode]);

  if (!profileRecord) {
    return <NotFoundCard message='Profile not found' />;
  }

  const { username, full_name, signed_url, isMyProfile } = profileRecord.user;

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
    <>
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

      {/* Personal mode info modal */}
      <Modal open={showPersonalModeModal} onOpenChange={setShowPersonalModeModal}>
        <Modal.Content size='sm'>
          <Modal.Body className='p-6'>
            <div className='flex w-full items-center justify-center py-4'>
              <Info size={36} className='text-info' />
            </div>

            <p className='font-secondary text-md pb-2 text-center'>
              You’re now in <span className='font-bold'>Personal Mode</span>
            </p>

            <p className='text-muted-foreground font-secondary text-center text-sm'>
              You are browsing Gonasi as an individual. Organization-specific actions and content
              are hidden until you switch back to an organization.
            </p>

            <div className='mt-6 text-right'>
              <Button variant='ghost' onClick={() => setShowPersonalModeModal(false)}>
                Close
              </Button>
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </>
  );
}
