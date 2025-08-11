import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { Footer } from '~/components/footer';
import { Spinner } from '~/components/loaders';
import { BottomNav } from '~/components/navigation/bottom-nav/bottom-nav';
import { TopNav } from '~/components/navigation/top-nav';
import { useStore } from '~/store';

export default function MainLayout() {
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
      <TopNav user={activeUserProfile} />
      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
      <Footer />
      <BottomNav user={activeUserProfile} />
    </div>
  );
}
