import { data, Outlet, redirect } from 'react-router';

import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/plain-onboarding';

import { OnboardingStepperFormLayout } from '~/components/layouts/onboarding';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  if (!user) {
    return redirect(
      `/login?${new URLSearchParams({ redirectTo: new URL(request.url).pathname + new URL(request.url).search })}`,
    );
  }

  if (user && user.is_onboarding_complete) {
    return redirect('/go');
  }

  return data({ success: true });
}

export default function OnboardingLayout() {
  const steps = [
    { id: 'basic-info', title: 'Basic Info', path: 'basic-information' },
    { id: 'contact-info', title: 'Contact Info', path: 'contact-information' },
  ];

  return (
    <section className='mx-auto max-w-lg md:mt-16'>
      <OnboardingStepperFormLayout steps={steps}>
        <Outlet />
      </OnboardingStepperFormLayout>
    </section>
  );
}
