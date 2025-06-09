import { Form, redirect, useSearchParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rocket } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { safeRedirect } from 'remix-utils/safe-redirect';

import { signUpWithEmailAndPassword } from '@gonasi/database/auth';
import { SignupFormSchema, type SignupFormSchemaTypes } from '@gonasi/schemas/auth';

import type { Route } from './+types/signup';

import { getClientEnv } from '~/.server/env.server';
import { GoLink } from '~/components/go-link';
import { AuthFormLayout } from '~/components/layouts/auth';
import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const { BASE_URL } = getClientEnv();

// SEO metadata for the Sign Up page
export function meta() {
  return [{ title: 'Sign up | Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

const resolver = zodResolver(SignupFormSchema);

/**
 * Handles form submission on the server side
 */
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  // Anti-spam honeypot check
  await checkHoneypot(formData);

  // Create Supabase client instance
  const { supabase, headers } = createClient(request);

  // Validate and parse form data using zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<SignupFormSchemaTypes>(formData, resolver);

  // If validation failed, return errors and default values
  if (errors) {
    return { errors, defaultValues };
  }

  // Attempt to sign up the user
  const { error } = await signUpWithEmailAndPassword(supabase, {
    ...data,
    redirectTo: `${BASE_URL}/onboarding`,
  });

  // If sign-up failed, show toast error; else redirect
  return error ? dataWithError(null, error.message) : redirect(safeRedirect('/login'), { headers });
}

/**
 * Sign-up form component
 */
export default function SignUp() {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  // Initialize form methods with Remix Hook Form
  const methods = useRemixForm<SignupFormSchemaTypes>({
    mode: 'all',
    resolver,
    submitData: { redirectTo },
  });

  return (
    <AuthFormLayout
      title='Sign up'
      description={
        <div>
          Already a member? <GoLink to='/login'>Log in</GoLink>
        </div>
      }
      leftLink='/login'
      closeLink='/'
    >
      <RemixFormProvider {...methods}>
        <Form method='POST' onSubmit={methods.handleSubmit}>
          {/* Anti-bot honeypot field */}
          <HoneypotInputs />

          {/* Full name input field */}
          <GoInputField
            labelProps={{ children: 'Your name or company', required: true }}
            name='fullName'
            inputProps={{
              autoFocus: true,
            }}
            description='Let us know who you are, whether it’s just you or your team'
          />

          {/* Email input field */}
          <GoInputField
            labelProps={{ children: 'Email address', required: true }}
            name='email'
            inputProps={{
              className: 'lowercase',
              autoComplete: 'email',
            }}
            description='We’ll use this to keep in touch'
          />

          {/* Password input field */}
          <GoInputField
            labelProps={{ children: 'Choose a password', required: true }}
            name='password'
            inputProps={{
              type: 'password',
              autoComplete: 'current-password',
            }}
            description='Make it something secure (but memorable!)'
          />

          {/* Submit button with loading state */}
          <Button
            type='submit'
            disabled={isPending}
            isLoading={isPending || methods.formState.isSubmitting}
            className='w-full'
            rightIcon={<Rocket />}
          >
            Let’s get started
          </Button>
        </Form>
      </RemixFormProvider>
    </AuthFormLayout>
  );
}
