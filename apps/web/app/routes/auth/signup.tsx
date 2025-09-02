import { Form, redirectDocument, useSearchParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rocket } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { safeRedirect } from 'remix-utils/safe-redirect';

import { signUpWithEmailAndPassword } from '@gonasi/database/auth';
import { SignupFormSchema, type SignupFormSchemaTypes } from '@gonasi/schemas/auth';

import type { Route } from './+types/signup';

import { GoLink } from '~/components/go-link';
import { AuthFormLayout } from '~/components/layouts/auth';
import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
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
  const { error } = await signUpWithEmailAndPassword(supabase, data);

  if (error) {
    console.error('Supabase signup error:', {
      message: error.message,
      status: error.status,
      details: error,
      email: data?.email, // okay to log since user just entered it
    });

    return dataWithError(
      null,
      'We couldn’t create your account. Please try again or use a different email.',
    );
  }

  return redirectDocument(safeRedirect(data.redirectTo ?? '/'), { headers });
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
            description='We’ll use this to keep in touch'
          />

          {/* Password input field */}
          <GoInputField
            labelProps={{ children: 'Choose a Password', required: true }}
            name='password'
            inputProps={{
              type: 'password',
              autoComplete: 'current-password',
              disabled: isDisabled,
            }}
            description='Make it something secure (but memorable!)'
          />

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
