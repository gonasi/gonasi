import { useEffect } from 'react';
import { Form, useLocation, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Footprints, LoaderCircle, Rocket } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { checkUserNameExists } from '@gonasi/database/onboarding';
import type { OnboardingSchemaTypes } from '@gonasi/schemas/onboarding';
import { OnboardingSchema } from '@gonasi/schemas/onboarding';

import type { Route } from './+types/onboarding-index';

import { AppLogo } from '~/components/app-logo';
import { Spinner } from '~/components/loaders';
import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Meta information for the page
export function meta() {
  return [
    { title: 'Gonasi | Personal Profile Setup' },
    {
      name: 'description',
      content:
        'Set up your personal profile on Gonasi. Add your name and choose a unique username to get started.',
    },
  ];
}

// Setup Zod schema validation for the form
const resolver = zodResolver(OnboardingSchema);

// Server-side action for processing form submissions
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Spam protection
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const session = await getFormStepperSessionData(request);

  // Validate the submitted form data
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<OnboardingSchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  // Check for duplicate username
  const usernameExists = await checkUserNameExists(supabase, data.username);
  if (usernameExists) {
    return {
      errors: {
        username: { message: 'Username already exists' },
      },
      defaultValues,
    };
  }

  return true;
}

// Client-side onboarding form
export default function PersonalInformation() {
  const isPending = useIsPending();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();

  const methods = useRemixForm<OnboardingSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      fullName: '', // Initially empty
    },
  });

  const { reset } = methods;

  useEffect(() => {
    if (isActiveUserProfileLoading || !activeUserProfile) return;

    if (!activeUserProfile) {
      const redirectTo = location.pathname + location.search;
      navigate(`/login?${new URLSearchParams({ redirectTo })}`, { replace: true });
      return;
    }

    if (activeUserProfile.username) {
      navigate(`/${activeUserProfile.username}`, { replace: true });
      return;
    }

    reset({
      fullName: activeUserProfile.full_name ?? '',
    });
  }, [
    activeUserProfile,
    isActiveUserProfileLoading,
    location.pathname,
    location.search,
    navigate,
    reset,
  ]);

  if (isActiveUserProfileLoading || !activeUserProfile || activeUserProfile.username) {
    return <Spinner />;
  }

  console.log('errors: ', methods.formState.errors);

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <div className='mx-auto flex max-w-md flex-col space-y-4 px-4 py-10'>
      <div className='flex w-full items-center justify-center'>
        <AppLogo />
      </div>
      <div className='font-secondary text-muted-foreground inline-flex items-center'>
        <span>
          <Footprints size={12} />
        </span>
        <span>One more step</span>
        <span>...</span>
      </div>
      <RemixFormProvider {...methods}>
        <Form method='POST' onSubmit={methods.handleSubmit}>
          <HoneypotInputs />

          <GoInputField
            labelProps={{ children: 'Your Name', required: true }}
            name='fullName'
            inputProps={{
              disabled: isDisabled,
            }}
            description='Let us know who you are, whether it’s just you or your team'
          />

          <GoInputField
            labelProps={{
              children: 'Username',
              required: true,
              endAdornment: isDisabled ? <LoaderCircle size={12} className='animate-spin' /> : null,
            }}
            name='username'
            inputProps={{
              className: 'lowercase',
              autoFocus: true,
              disabled: isDisabled,
            }}
            description='Pick something short and memorable... like a handle.'
          />

          <div className='mt-6 flex w-full justify-end'>
            <Button
              type='submit'
              disabled={isDisabled}
              isLoading={isDisabled}
              rightIcon={<Rocket />}
            >
              {`Let's Go`}
            </Button>
          </div>
        </Form>
      </RemixFormProvider>
    </div>
  );
}
