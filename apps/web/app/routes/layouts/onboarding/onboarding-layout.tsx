import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';

import { OnboardingStepperFormLayout } from '~/components/layouts/onboarding';
import { Spinner } from '~/components/loaders';
import type { AppOutletContext } from '~/root';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

const steps = [
  { id: 'basic-info', title: 'Basic Info', path: 'basic-information' },
  { id: 'contact-info', title: 'Contact Info', path: 'contact-information' },
];

export default function OnboardingLayout() {
  const { user } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      const redirectTo = location.pathname + location.search;
      navigate(`/login?${new URLSearchParams({ redirectTo })}`, { replace: true });
      return;
    }

    if (user.is_onboarding_complete) {
      navigate(`/${user.username}`, { replace: true });
    }
  }, [user, location, navigate]);

  if (!user || user.is_onboarding_complete) return <Spinner />;

  return (
    <section className='mx-auto max-w-lg md:mt-16'>
      <OnboardingStepperFormLayout steps={steps}>
        <Outlet />
      </OnboardingStepperFormLayout>
    </section>
  );
}
