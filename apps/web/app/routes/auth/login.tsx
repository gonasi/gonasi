import { Form, redirectDocument, useSearchParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { safeRedirect } from 'remix-utils/safe-redirect';

import { signInWithEmailAndPassword } from '@gonasi/database/auth';
import { LoginFormSchema, type LoginFormSchemaTypes } from '@gonasi/schemas/auth';

import type { Route } from './+types/login';

import { GoLink } from '~/components/go-link';
import { GoogleIcon } from '~/components/icons';
import { AuthFormLayout } from '~/components/layouts/auth';
import { Button, OutlineButton } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { Separator } from '~/components/ui/separator';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

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

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase, headers } = createClient(request);
  const intent = formData.get('intent') as string;

  // Handle Google OAuth
  if (intent === 'google') {
    const redirectTo = formData.get('redirectTo') as string | null;
    const origin = new URL(request.url).origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/v1/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`,
        // Enable PKCE flow
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return dataWithError(null, error.message || 'Failed to authenticate with Google.');
    }

    return redirectDocument(data.url, { headers });
  }

  // Handle email/password login (existing logic)
  const { errors, data } = await getValidatedFormData(formData, zodResolver(LoginFormSchema));
  if (errors) return dataWithError(null, 'Something went wrong. Please try again.');

  const { error } = await signInWithEmailAndPassword(supabase, data);
  if (error) return dataWithError(null, error.message || 'Incorrect email or password.');

  return redirectDocument(safeRedirect(data.redirectTo ?? '/'), { headers });
}

export default function Login() {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const methods = useRemixForm<LoginFormSchemaTypes>({
    mode: 'all',
    resolver: zodResolver(LoginFormSchema),
    submitData: { redirectTo },
  });

  const isDisabled = isPending;

  return (
    <AuthFormLayout
      title='Log in'
      description={
        <div>
          Not a member yet?{' '}
          <GoLink
            to={`/signup${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
          >
            Sign up
          </GoLink>
        </div>
      }
      leftLink='/'
    >
      <div className='pb-8'>
        <Form method='POST'>
          <HoneypotInputs />
          <input type='hidden' name='intent' value='google' />
          <input type='hidden' name='redirectTo' value={redirectTo || ''} />
          <OutlineButton
            type='submit'
            className='w-full rounded-full'
            leftIcon={<GoogleIcon className='mb-1' />}
            disabled={isDisabled}
          >
            Log in with Google
          </OutlineButton>
        </Form>
      </div>
      <Separator className='mb-4' />
      <RemixFormProvider {...methods}>
        <Form method='POST' onSubmit={methods.handleSubmit}>
          <HoneypotInputs />
          <GoInputField
            labelProps={{ children: 'Email Address', required: true }}
            name='email'
            inputProps={{
              autoFocus: true,
              className: 'lowercase',
              autoComplete: 'email',
              disabled: isDisabled,
            }}
            description='Enter the email you registered with.'
          />
          <GoInputField
            labelProps={{
              children: 'Your Password',
              required: true,
              endAdornment: <GoLink to='/'>Forgot it?</GoLink>,
            }}
            name='password'
            inputProps={{
              type: 'password',
              autoComplete: 'current-password',
              disabled: isDisabled,
            }}
            description="We won't tell anyone, promise 😊"
          />
          <Button type='submit' disabled={isDisabled} isLoading={isDisabled} className='w-full'>
            Log In
          </Button>
        </Form>
      </RemixFormProvider>
    </AuthFormLayout>
  );
}
