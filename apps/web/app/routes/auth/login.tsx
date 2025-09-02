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
import { AuthFormLayout } from '~/components/layouts/auth';
import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
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

  const { errors, data } = await getValidatedFormData(formData, zodResolver(LoginFormSchema));
  if (errors) return dataWithError(null, 'Something went wrong. Please try again.');

  const { supabase, headers } = createClient(request);
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
          Not a member yet? <GoLink to='/signup'>Sign up</GoLink>
        </div>
      }
      leftLink='/'
    >
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
            description='We won’t tell anyone, promise 😊'
          />
          <Button type='submit' disabled={isDisabled} isLoading={isDisabled} className='w-full'>
            Log In
          </Button>
        </Form>
      </RemixFormProvider>
    </AuthFormLayout>
  );
}
