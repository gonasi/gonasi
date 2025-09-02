import { Form, useSearchParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rocket } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { signUpWithEmailAndPassword } from '@gonasi/database/auth';
import { checkEmailExists } from '@gonasi/database/profile';
import { SignupFormSchema, type SignupFormSchemaTypes } from '@gonasi/schemas/auth';

import type { Route } from './+types/signup';

import { GoLink } from '~/components/go-link';
import { AuthFormLayout } from '~/components/layouts/auth';
import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { PasswordStrengthIndicator } from '~/components/ui/password-strength-indicator';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// SEO metadata for the Sign Up page
export function meta() {
  return [{ title: 'Sign up • Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

const resolver = zodResolver(SignupFormSchema);

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, zodResolver(SignupFormSchema));
  if (errors) {
    console.error('Signup validation failed:', { errors });
    return dataWithError(null, 'Invalid input. Please check the form and try again.');
  }

  const { supabase, headers } = createClient(request);

  // 🔍 Check if the user already exists
  const emailExists = await checkEmailExists(supabase, data.email);

  if (emailExists) {
    console.error('Supabase user check error:', emailExists);
    return dataWithError(
      null,
      `An account with this email already exists. Please sign in instead.`,
    );
  }

  // 🚀 Proceed with signup
  const { error } = await signUpWithEmailAndPassword(supabase, data);

  if (error) {
    console.error('Supabase signup error:', {
      message: error.message,
      status: error.status,
      details: error,
      email: data?.email, // safe to log since just submitted
    });

    return dataWithError(
      null,
      error.message ||
        `We couldn't create your account. Please try again or use a different email.`,
    );
  }

  return redirectWithSuccess(
    data.redirectTo ?? '/',
    'Your account has been created! Please check your email to verify it.',
    { headers },
  );
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

  const isDisabled = isPending || methods.formState.isSubmitting;
  const passwordValue = methods.watch('password') || '';

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
            labelProps={{ children: 'Your Name', required: true }}
            name='fullName'
            inputProps={{
              autoFocus: true,
              disabled: isDisabled,
            }}
            description='Let us know who you are'
          />

          {/* Email input field */}
          <GoInputField
            labelProps={{ children: 'Email Address', required: true }}
            name='email'
            inputProps={{
              className: 'lowercase',
              autoComplete: 'email',
              disabled: isDisabled,
            }}
            description="We'll use this to keep in touch"
          />

          {/* Password input field with strength indicator */}
          <div className='space-y-2'>
            <GoInputField
              labelProps={{ children: 'Choose a Password', required: true }}
              name='password'
              inputProps={{
                type: 'password',
                autoComplete: 'new-password',
                disabled: isDisabled,
              }}
              description='Make it something secure (but memorable!)'
            />

            {/* Password strength indicator */}
            {passwordValue && <PasswordStrengthIndicator password={passwordValue} />}
          </div>

          {/* Submit button with loading state */}
          <Button
            type='submit'
            disabled={isPending}
            isLoading={isDisabled}
            className='w-full'
            rightIcon={<Rocket />}
          >
            Sign Up
          </Button>
        </Form>
      </RemixFormProvider>
    </AuthFormLayout>
  );
}
