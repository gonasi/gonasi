import { Form, useSearchParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rocket } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { SignupFormSchema, type SignupFormSchemaTypes } from '@gonasi/schemas/auth';

import { GoLink } from '~/components/go-link';
import { AuthFormLayout } from '~/components/layouts/auth';
import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { useIsPending } from '~/utils/misc';

// SEO metadata for the Sign Up page
export function meta() {
  return [{ title: 'Sign up | Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

const resolver = zodResolver(SignupFormSchema);

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
    defaultValues: {
      intent: 'signup',
    },
    submitConfig: {
      action: '/',
    },
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
            labelProps={{ children: 'Your name or company', required: true }}
            name='fullName'
            inputProps={{
              autoFocus: true,
              disabled: isDisabled,
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
              disabled: isDisabled,
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
