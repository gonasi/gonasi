import { Form, useSearchParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { LoginFormSchema, type LoginFormSchemaTypes } from '@gonasi/schemas/auth';

import { GoLink } from '~/components/go-link';
import { AuthFormLayout } from '~/components/layouts/auth';
import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { useIsPending } from '~/utils/misc';

// SEO metadata
export function meta() {
  return [
    { title: 'Log in to Gonasi | Build Interactive Courses Easily' },
    {
      name: 'description',
      content:
        'Log in to your Gonasi account to create and manage engaging interactive courses. Use our no-code builder with AI feedback, simulations, and progress tracking.',
    },
  ];
}

const resolver = zodResolver(LoginFormSchema);

// Login page component
export default function Login() {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const methods = useRemixForm<LoginFormSchemaTypes>({
    mode: 'all',
    resolver,
    submitData: { redirectTo },
    submitConfig: {
      action: '/',
    },
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
          {/* Bot protection */}
          <HoneypotInputs />

          {/* Email input */}
          <GoInputField
            labelProps={{ children: 'Email address', required: true }}
            name='email'
            inputProps={{
              autoFocus: true,
              className: 'lowercase',
              autoComplete: 'email',
              disabled: isDisabled,
            }}
            description='Enter the email you registered with.'
          />

          {/* Password input */}
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
            description='We won’t tell anyone, promise 😊'
          />

          {/* Hidden field for action intent */}
          <input type='hidden' {...methods.register('intent')} value='login' />

          {/* Submit button */}
          <Button type='submit' disabled={isDisabled} isLoading={isDisabled} className='w-full'>
            Log me in
          </Button>
        </Form>
      </RemixFormProvider>
    </AuthFormLayout>
  );
}
