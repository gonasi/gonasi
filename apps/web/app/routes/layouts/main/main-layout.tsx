import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { Spinner } from '~/components/loaders';
import { BottomNav } from '~/components/navigation/bottom-nav/bottom-nav';
import { TopNav } from '~/components/navigation/top-nav';
import { useStore } from '~/store';

export default function MainLayout() {
  const navigate = useNavigate();
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();

  const isOnboardingIncomplete = activeUserProfile && !activeUserProfile.is_onboarding_complete;

  useEffect(() => {
    if (!isActiveUserProfileLoading && isOnboardingIncomplete) {
      navigate(`/go/onboarding/${activeUserProfile.id}/contact-information`);
    }
  }, [isActiveUserProfileLoading, isOnboardingIncomplete, navigate, activeUserProfile?.id]);

  if (isActiveUserProfileLoading || isOnboardingIncomplete) {
    return <Spinner />;
  }

  return (
    <div>
      <TopNav user={activeUserProfile} />
      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
      <BottomNav user={activeUserProfile} />
    </div>
  );
}
