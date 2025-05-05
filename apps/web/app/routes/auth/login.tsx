import { Form, redirect, useSearchParams } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { safeRedirect } from 'remix-utils/safe-redirect';

import { signInWithEmailAndPassword } from '@gonasi/database/auth';
import { LoginFormSchema } from '@gonasi/schemas/auth';

import type { Route } from './+types/login';

import { GoLink } from '~/components/go-link';
import { AuthFormLayout } from '~/components/layouts/auth';
import { Button } from '~/components/ui/button';
import { Field } from '~/components/ui/forms';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Login - Gonasi' },
    {
      name: 'description',
      content:
        'Create an account on Gonasi and start managing your assets efficiently. Sign up now to access powerful tools for asset management.',
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase, headers } = createClient(request);

  const submission = parseWithZod(formData, { schema: LoginFormSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { error } = await signInWithEmailAndPassword(supabase, {
    ...submission.value,
  });

  const redirectTo = submission.value.redirectTo ?? '/go';

  return error
    ? dataWithError(null, 'Wrong email and or password')
    : redirect(safeRedirect(redirectTo), { headers });
}

export default function Login() {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const [form, fields] = useForm({
    id: 'login-form',
    constraint: getZodConstraint(LoginFormSchema),
    defaultValue: { redirectTo },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LoginFormSchema });
    },
    shouldRevalidate: 'onInput',
  });

  return (
    <AuthFormLayout
      title='Log in'
      description={
        <div>
          Not a member yet?{' '}
          <span>
            <GoLink to='/signup'>Sign up</GoLink>
          </span>
        </div>
      }
      leftLink='/'
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
            endAdornment: <GoLink to='/'>Forgot password?</GoLink>,
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
          Log in
        </Button>
      </Form>
    </AuthFormLayout>
  );
}
