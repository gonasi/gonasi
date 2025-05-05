import { data, Form, redirect } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { ChevronRight } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { z } from 'zod';

import { checkUserNameExists } from '@gonasi/database/onboarding';
import type { BasicInformationType } from '@gonasi/schemas/onboarding';
import { BasicInformationSchema } from '@gonasi/schemas/onboarding';

import type { Route } from './+types/basic-information';

import { Button } from '~/components/ui/button';
import { ErrorList, Field } from '~/components/ui/forms';
import { createClient } from '~/lib/supabase/supabase.server';
import {
  FORM_STEPPER_COOKIE_NAMES,
  formStepperSessionStorage,
  getFormStepperSessionData,
} from '~/utils/form.stepper.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Gonasi | Personal Information' },
    { name: 'description', content: 'Welcome to Gonasi' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getFormStepperSessionData(request);
  const storedData = session.get(FORM_STEPPER_COOKIE_NAMES.basicInfo) || {};
  return data(storedData as BasicInformationType);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const session = await getFormStepperSessionData(request);

  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      BasicInformationSchema.transform(async (data, ctx) => {
        if (intent !== null) return data;

        const usernameExists = await checkUserNameExists(supabase, data.username);

        if (usernameExists) {
          ctx.addIssue({
            path: ['username'],
            code: z.ZodIssueCode.custom,
            message: 'A user already exists with this username',
          });
          return z.NEVER;
        }

        const storedData = (session.get(FORM_STEPPER_COOKIE_NAMES.basicInfo) ||
          {}) as BasicInformationType;
        session.set(FORM_STEPPER_COOKIE_NAMES.basicInfo, { ...storedData, ...data });

        return { data };
      }),
    async: true,
  });

  if (submission.status !== 'success') {
    return data(
      { result: submission.reply() },
      { status: submission.status === 'error' ? 400 : 200 },
    );
  }

  return redirect(`/onboarding/${params.userId}/contact-information`, {
    headers: { 'Set-Cookie': await formStepperSessionStorage.commitSession(session) },
  });
}

export default function PersonalInformation({ loaderData, actionData }: Route.ComponentProps) {
  const isPending = useIsPending();
  const [form, fields] = useForm({
    id: 'basic-information-onboarding-form',
    constraint: getZodConstraint(BasicInformationSchema),
    lastResult: actionData?.result,
    defaultValue: loaderData,
    shouldValidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: BasicInformationSchema });
    },
    shouldRevalidate: 'onInput',
  });

  return (
    <Form method='POST' {...getFormProps(form)}>
      <HoneypotInputs />
      <Field
        labelProps={{ children: 'Name / Company name', required: true }}
        inputProps={{ ...getInputProps(fields.fullName, { type: 'text' }), autoFocus: true }}
        errors={fields.fullName?.errors}
      />
      <Field
        labelProps={{ children: 'Username', required: true }}
        inputProps={{
          ...getInputProps(fields.username, { type: 'text' }),
          className: 'lowercase',
        }}
        errors={fields.username?.errors}
      />
      <ErrorList errors={form.errors} id={form.errorId} />
      <div className='flex w-full justify-end'>
        <Button
          type='submit'
          disabled={isPending}
          isLoading={isPending}
          rightIcon={<ChevronRight />}
        >
          Next
        </Button>
      </div>
    </Form>
  );
}
