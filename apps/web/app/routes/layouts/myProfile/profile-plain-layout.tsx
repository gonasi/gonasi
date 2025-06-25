import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { Spinner } from '~/components/loaders';
import { useStore } from '~/store';

export default function ProfileWrapperLayout() {
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

  return <Outlet />;
}
