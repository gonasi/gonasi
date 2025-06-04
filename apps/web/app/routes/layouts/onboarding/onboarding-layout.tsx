import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { OnboardingStepperFormLayout } from '~/components/layouts/onboarding';
import { Spinner } from '~/components/loaders';
import { useStore } from '~/store';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

const steps = [
  { id: 'basic-info', title: 'Basic Info', path: 'basic-information' },
  { id: 'contact-info', title: 'Contact Info', path: 'contact-information' },
];

export default function OnboardingLayout() {
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isActiveUserProfileLoading) return;

    if (!activeUserProfile) {
      const redirectTo = location.pathname + location.search;
      navigate(`/login?${new URLSearchParams({ redirectTo })}`, { replace: true });
      return;
    }

    if (activeUserProfile.is_onboarding_complete) {
      navigate(`/${activeUserProfile.username}`, { replace: true });
    }
  }, [activeUserProfile, isActiveUserProfileLoading, location.pathname, location.search, navigate]);

  if (isActiveUserProfileLoading || !activeUserProfile) {
    return <Spinner />;
  }

  if (activeUserProfile.is_onboarding_complete) {
    // avoid flicker before navigation happens
    return <Spinner />;
  }

  return (
    <section className='mx-auto max-w-lg md:mt-16'>
      <OnboardingStepperFormLayout steps={steps}>
        <Outlet />
      </OnboardingStepperFormLayout>
    </section>
  );
}
