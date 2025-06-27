import { useEffect, useRef } from 'react';
import { Form, redirect, useFetcher } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash/debounce';
import { Footprints, LoaderCircle, Rocket } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { completeUserOnboarding } from '@gonasi/database/onboarding';
import { getUserProfile } from '@gonasi/database/profile';
import type { OnboardingSchemaTypes } from '@gonasi/schemas/onboarding';
import { OnboardingSchema } from '@gonasi/schemas/onboarding';

import type { Route } from './+types/onboarding-index';

import { AppLogo } from '~/components/app-logo';
import { Button, NavLinkButton } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

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

// Handles form submission (POST)
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  // Bot detection using honeypot technique
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  // Validate incoming form data using Zod schema
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<OnboardingSchemaTypes>(formData, zodResolver(OnboardingSchema));

  if (errors) {
    return { errors, defaultValues };
  }

  // Persist data to Supabase and handle response
  const { success, message } = await completeUserOnboarding(supabase, data);

  return success
    ? redirectWithSuccess(`/go/${data.username}`, message)
    : dataWithError(null, message);
}

// Loads the current authenticated user profile (GET)
export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  if (user?.username) return redirect(`/go/${user.username}`);

  return user;
}

export default function PersonalInformation({ loaderData }: Route.ComponentProps) {
  const user = loaderData;
  const fetcher = useFetcher();
  const isPending = useIsPending();

  // Setup form with default full name and validation schema
  const methods = useRemixForm<OnboardingSchemaTypes>({
    mode: 'all',
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      fullName: user?.full_name ?? '',
      username: user?.username ?? '',
    },
  });

  const username = methods.watch('username');

  // Debounced function to check username availability
  const debouncedCheckRef = useRef(
    debounce((uname: string) => {
      fetcher.load(`/api/check-username-exists?username=${uname}`);
    }, 300),
  );

  // Runs debounced username check when input changes
  useEffect(() => {
    if (!username || username.length < 3) return;

    const debouncedFn = debouncedCheckRef.current;
    debouncedFn(username);

    // Cancel debounce on cleanup to prevent race conditions
    return () => {
      debouncedFn.cancel();
    };
  }, [username]);

  // Apply error to form if username is taken
  useEffect(() => {
    if (fetcher.data?.exists) {
      methods.setError('username', {
        type: 'manual',
        message: 'This username is already taken.',
      });
    } else if (
      fetcher.data?.exists === false &&
      methods.formState.errors.username?.type === 'manual'
    ) {
      // Clear the manual error if username is available
      methods.clearErrors('username');
    }
  }, [fetcher.data, methods]);

  const isDisabled = isPending || methods.formState.isSubmitting;
  const hasUsernameError = !!methods.formState.errors.username;

  return (
    <div className='mx-auto flex max-w-md flex-col space-y-4 px-4 py-10'>
      {/* App logo */}
      <div className='flex w-full items-center justify-center'>
        <AppLogo />
      </div>

      {/* Header and Signout */}
      <div className='flex w-full items-center justify-between'>
        <div className='font-secondary text-muted-foreground inline-flex w-full items-center'>
          <span>
            <Footprints size={12} />
          </span>
          <span>One more step</span>
          <span>...</span>
        </div>
        <div>
          <NavLinkButton to='/signout' size='sm' variant='secondary' className='rounded-full'>
            Sign Out
          </NavLinkButton>
        </div>
      </div>

      {/* Onboarding form */}
      <RemixFormProvider {...methods}>
        <Form method='POST' onSubmit={methods.handleSubmit}>
          <HoneypotInputs />

          {/* Full Name input */}
          <GoInputField
            labelProps={{ children: 'Your Name', required: true }}
            name='fullName'
            inputProps={{ disabled: isDisabled }}
            description={`Let us know who you are, whether it's just you or your team`}
          />

          {/* Username input with loading spinner */}
          <GoInputField
            labelProps={{
              children: 'Username',
              required: true,
              endAdornment:
                fetcher.state !== 'idle' ? (
                  <LoaderCircle size={12} className='animate-spin' />
                ) : null,
            }}
            name='username'
            inputProps={{
              className: 'lowercase',
              autoFocus: true,
              disabled: isDisabled,
            }}
            description={
              fetcher.data?.exists
                ? 'This username is already taken.'
                : 'Pick something short and memorable... like a handle.'
            }
          />

          {/* Submit button */}
          <div className='mt-6 flex w-full justify-end'>
            <Button
              type='submit'
              disabled={isDisabled || fetcher.state !== 'idle' || hasUsernameError}
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
