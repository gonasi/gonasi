import { data, Form } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { ChevronRight } from 'lucide-react';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { completeUserOnboarding } from '@gonasi/database/onboarding';
import type { BasicInformationType, ContactInformationType } from '@gonasi/schemas/onboarding';
import { BasicInformationSchema, ContactInformationSchema } from '@gonasi/schemas/onboarding';

import type { Route } from './+types/contact-information';

import { Button } from '~/components/ui/button';
import { ErrorList, Field } from '~/components/ui/forms';
import { createClient } from '~/lib/supabase/supabase.server';
import {
  deleteFormStepperSessionKey,
  FORM_STEPPER_COOKIE_NAMES,
  getFormStepperSessionData,
  validateStepData,
} from '~/utils/form.stepper.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Gonasi | Contact Information' },
    { name: 'description', content: 'Welcome to Gonasi' },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const session = await getFormStepperSessionData(request);

  validateStepData(
    session,
    FORM_STEPPER_COOKIE_NAMES.basicInfo,
    BasicInformationSchema,
    `/onboarding/${params.userId}/basic-information`,
  );

  return data({} as ContactInformationType);
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getFormStepperSessionData(request);

  const basicInfo = session.get(FORM_STEPPER_COOKIE_NAMES.basicInfo) as BasicInformationType;
  const formData = await request.formData();

  await checkHoneypot(formData);

  const schema = BasicInformationSchema.merge(ContactInformationSchema);

  // Convert FormData to a plain object that contains both basicInfo and contactInfo fields
  const contactInfoObj = Object.fromEntries(formData.entries());

  // Now merge both objects properly
  const mergedData = {
    ...basicInfo,
    ...contactInfoObj,
  };

  // Create a new FormData object for parseWithZod
  const mergedFormData = new FormData();
  for (const [key, value] of Object.entries(mergedData)) {
    mergedFormData.append(key, value as string);
  }

  const submission = parseWithZod(mergedFormData, { schema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { supabase } = createClient(request);

  const { success, message } = await completeUserOnboarding(supabase, {
    ...submission.value,
  });

  if (!success) {
    return dataWithError(null, message);
  }

  const response = await deleteFormStepperSessionKey(request, FORM_STEPPER_COOKIE_NAMES.basicInfo);
  return redirectWithSuccess('/go', message, {
    headers: response.headers, // Forward the Set-Cookie header
  });
}

export default function ContactInformation({ loaderData, actionData }: Route.ComponentProps) {
  const isPending = useIsPending();
  const [form, fields] = useForm({
    id: 'contact-information-onboarding-form',
    constraint: getZodConstraint(ContactInformationSchema),
    lastResult: actionData?.result,
    defaultValue: loaderData,
    shouldValidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ContactInformationSchema });
    },
    shouldRevalidate: 'onInput',
  });

  return (
    <Form method='POST' {...getFormProps(form)}>
      <HoneypotInputs />
      <Field
        prefix='+254'
        labelProps={{ children: 'Phone number', required: true }}
        inputProps={{
          ...getInputProps(fields.phoneNumber, { type: 'text' }),
          autoFocus: true,
        }}
        errors={fields.phoneNumber?.errors}
      />

      <ErrorList errors={form.errors} id={form.errorId} />

      <Button
        type='submit'
        disabled={isPending}
        isLoading={isPending}
        rightIcon={<ChevronRight />}
        className='w-full'
      >
        Complete
      </Button>
    </Form>
  );
}
