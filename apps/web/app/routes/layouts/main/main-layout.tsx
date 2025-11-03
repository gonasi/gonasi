import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { getUserRole } from '@gonasi/database/auth';

import type { Route } from './+types/main-layout';

import { Footer } from '~/components/footer';
import { Spinner } from '~/components/loaders';
import { BottomNav } from '~/components/navigation/bottom-nav/bottom-nav';
import { TopNav } from '~/components/navigation/top-nav';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const userRole = await getUserRole(supabase);

  return userRole;
}

export default function MainLayout({ loaderData }: Route.ComponentProps) {
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
      <TopNav user={activeUserProfile} userRole={loaderData} />
      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
      <Footer />
      <BottomNav user={activeUserProfile} />
    </div>
  );
}
