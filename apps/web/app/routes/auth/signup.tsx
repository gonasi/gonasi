import { Form, redirect, useSearchParams } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { safeRedirect } from 'remix-utils/safe-redirect';

import { signUpWithEmailAndPassword } from '@gonasi/database/auth';
import { LoginFormSchema } from '@gonasi/schemas/auth';

import type { Route } from './+types/signup';

import { getClientEnv } from '~/.server/env.server';
import { GoLink } from '~/components/go-link';
import { AuthFormLayout } from '~/components/layouts/auth';
import { Button } from '~/components/ui/button';
import { Field } from '~/components/ui/forms';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const { BASE_URL } = getClientEnv();

export function meta() {
  return [{ title: 'Sign up | Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase, headers } = createClient(request);

  const submission = parseWithZod(formData, { schema: LoginFormSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { error } = await signUpWithEmailAndPassword(supabase, {
    ...submission.value,
    emailRedirectTo: `${BASE_URL}/onboarding`,
  });

  const redirectTo = submission.value.redirectTo ?? '/go';

  return error
    ? dataWithError(null, error.message)
    : redirect(safeRedirect(redirectTo), { headers });
}

export default function SignUp() {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const [form, fields] = useForm({
    id: 'sign-up-form',
    constraint: getZodConstraint(LoginFormSchema),
    defaultValue: { redirectTo },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LoginFormSchema });
    },
    shouldRevalidate: 'onInput',
  });

  return (
    <AuthFormLayout
      title='Sign up'
      description={
        <div>
          Already a member?{' '}
          <span>
            <GoLink to='/login'>Log in</GoLink>
          </span>
        </div>
      }
      leftLink='/login'
      closeLink='/'
    >
      <Form method='POST' {...getFormProps(form)}>
        <HoneypotInputs />

        <Field
          labelProps={{ children: 'Email', required: true }}
          inputProps={{
            ...getInputProps(fields.email, { type: 'email' }),
            autoFocus: true,
            className: 'lowercase',
            autoComplete: 'email',
          }}
          errors={fields.email.errors}
        />
        <Field
          labelProps={{
            children: 'Password',
            required: true,
          }}
          inputProps={{
            ...getInputProps(fields.password, {
              type: 'password',
            }),
            autoComplete: 'current-password',
          }}
          errors={fields.password.errors}
        />

        <input {...getInputProps(fields.redirectTo, { type: 'hidden' })} />
        <Button type='submit' disabled={isPending} isLoading={isPending} className='w-full'>
          Sign up
        </Button>
      </Form>
    </AuthFormLayout>
  );
}
