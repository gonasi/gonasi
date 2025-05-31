import { Form, redirect, useSearchParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { safeRedirect } from 'remix-utils/safe-redirect';

import { signUpWithEmailAndPassword } from '@gonasi/database/auth';
import { LoginFormSchema, type LoginFormSchemaTypes } from '@gonasi/schemas/auth';

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

const resolver = zodResolver(LoginFormSchema);

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
  } = await getValidatedFormData<LoginFormSchemaTypes>(formData, resolver);

  // If validation failed, return errors and default values
  if (errors) {
    return { errors, defaultValues };
  }

  // Attempt to sign up the user
  const { error } = await signUpWithEmailAndPassword(supabase, {
    ...data,
    emailRedirectTo: `${BASE_URL}/onboarding`,
  });

  const redirectTo = data.redirectTo ?? '/';

  // If sign-up failed, show toast error; else redirect
  return error
    ? dataWithError(null, error.message)
    : redirect(safeRedirect(redirectTo), { headers });
}

/**
 * Sign-up form component
 */
export default function SignUp() {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  // Initialize form methods with Remix Hook Form
  const methods = useRemixForm<LoginFormSchemaTypes>({
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

          {/* Email input field */}
          <GoInputField
            labelProps={{ children: 'Email', required: true }}
            name='email'
            inputProps={{
              autoFocus: true,
              className: 'lowercase',
              autoComplete: 'email',
            }}
          />

          {/* Password input field */}
          <GoInputField
            labelProps={{ children: 'Password', required: true }}
            name='password'
            inputProps={{
              type: 'password',
              autoComplete: 'current-password',
            }}
          />

          {/* Submit button with loading state */}
          <Button
            type='submit'
            disabled={isPending}
            isLoading={isPending || methods.formState.isSubmitting}
            className='w-full'
          >
            Sign up
          </Button>
        </Form>
      </RemixFormProvider>
    </AuthFormLayout>
  );
}
