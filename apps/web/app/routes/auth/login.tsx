import { Form, redirect, useSearchParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { safeRedirect } from 'remix-utils/safe-redirect';

import { signInWithEmailAndPassword } from '@gonasi/database/auth';
import { LoginFormSchema, type LoginFormSchemaTypes } from '@gonasi/schemas/auth';

import type { Route } from './+types/login';

import { GoLink } from '~/components/go-link';
import { AuthFormLayout } from '~/components/layouts/auth';
import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Metadata for the route
export function meta() {
  return [
    { title: 'Login - Build Interactive Courses | Gonasi' },
    {
      name: 'description',
      content:
        'Create and explore interactive courses with Gonasi’s no-code course builder. Engage learners through simulations, challenges, AI feedback, and dynamic progress tracking.',
    },
  ];
}

const resolver = zodResolver(LoginFormSchema);

/**
 * Server-side action to handle login form submission.
 */
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  // Anti-spam measure
  await checkHoneypot(formData);

  // Initialize Supabase and headers for redirect
  const { supabase, headers } = createClient(request);

  // Validate and parse form data with Zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<LoginFormSchemaTypes>(formData, resolver);

  // Return validation errors, if any
  if (errors) {
    return { errors, defaultValues };
  }

  // Attempt login using Supabase auth
  const { error } = await signInWithEmailAndPassword(supabase, data);

  // Default redirect path after login
  const redirectTo = data.redirectTo ?? '/';

  // If auth failed, return toast error; otherwise, redirect
  return error
    ? dataWithError(null, 'Wrong email and or password')
    : redirect(safeRedirect(redirectTo), { headers });
}

/**
 * Login form UI
 */
export default function Login() {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  // Initialize form methods with validation
  const methods = useRemixForm<LoginFormSchemaTypes>({
    mode: 'all',
    resolver,
    submitData: { redirectTo },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <AuthFormLayout
      title='Log in'
      description={
        <div>
          Not a member yet? <GoLink to='/signup'>Sign up</GoLink>
        </div>
      }
      leftLink='/'
    >
      <RemixFormProvider {...methods}>
        <Form method='POST' onSubmit={methods.handleSubmit}>
          {/* Anti-bot honeypot field */}
          <HoneypotInputs />

          {/* Email input field */}
          <GoInputField
            labelProps={{ children: 'Email address', required: true }}
            name='email'
            inputProps={{
              autoFocus: true,
              className: 'lowercase',
              autoComplete: 'email',
              disabled: isDisabled,
            }}
            description='The one you signed up with'
          />

          {/* Password input field with forgot password link */}
          <GoInputField
            labelProps={{
              children: 'Your password',
              required: true,
              endAdornment: <GoLink to='/'>Forgot it?</GoLink>,
            }}
            name='password'
            inputProps={{
              type: 'password',
              autoComplete: 'current-password',
              disabled: isDisabled,
            }}
            description='We won’t tell anyone — promise'
          />

          {/* Submit button with loading state */}
          <Button type='submit' disabled={isDisabled} isLoading={isDisabled} className='w-full'>
            Log me in
          </Button>
        </Form>
      </RemixFormProvider>
    </AuthFormLayout>
  );
}
