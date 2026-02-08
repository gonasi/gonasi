import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { getUserRole } from '@gonasi/database/auth';

import type { Route } from './+types/main-layout';

import { Spinner } from '~/components/loaders';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const userRole = await getUserRole(supabase);

  return userRole;
}

export default function PlainMainLayout({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();

  // Determine if onboarding is incomplete (i.e., username hasn't been set)
  const isOnboardingIncomplete = !!activeUserProfile && !activeUserProfile.username;

  useEffect(() => {
    // If loading is done and onboarding is incomplete, redirect to onboarding
    if (!isActiveUserProfileLoading && isOnboardingIncomplete && activeUserProfile) {
      navigate(`/go/onboarding/${activeUserProfile.id}`);
    }
  }, [isActiveUserProfileLoading, isOnboardingIncomplete, navigate, activeUserProfile]);

  // Show loading spinner during profile loading or redirect preparation
  if (isActiveUserProfileLoading || isOnboardingIncomplete) {
    return <Spinner />;
  }

  return (
    <div>
      <section className='min-h-screen'>
        <Outlet />
      </section>
    </div>
  );
}
