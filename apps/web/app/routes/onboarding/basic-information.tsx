import { data, Form, redirect } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, LoaderCircle } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { checkUserNameExists } from '@gonasi/database/onboarding';
import type { BasicInformationSchemaTypes } from '@gonasi/schemas/onboarding';
import { BasicInformationSchema } from '@gonasi/schemas/onboarding';

import type { Route } from './+types/basic-information';

import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';
import {
  FORM_STEPPER_COOKIE_NAMES,
  formStepperSessionStorage,
  getFormStepperSessionData,
} from '~/utils/form.stepper.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Gonasi | Personal Info' },
    { name: 'description', content: 'Let’s get started with a few basics.' },
  ];
}

const resolver = zodResolver(BasicInformationSchema);

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getFormStepperSessionData(request);
  const storedData = session.get(FORM_STEPPER_COOKIE_NAMES.basicInfo) || {};
  return data(storedData as BasicInformationSchemaTypes);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const session = await getFormStepperSessionData(request);

  // Validate and parse form data with Zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<BasicInformationSchemaTypes>(formData, resolver);

  // Return validation errors, if any
  if (errors) {
    return { errors, defaultValues };
  }

  const usernameExists = await checkUserNameExists(supabase, data.username);

  if (usernameExists) {
    return {
      errors: {
        username: {
          message: 'Username already exists',
        },
      },
      defaultValues,
    };
  }

  const storedData = session.get(FORM_STEPPER_COOKIE_NAMES.basicInfo) || {};
  session.set(FORM_STEPPER_COOKIE_NAMES.basicInfo, { ...storedData, ...data });

  return redirect(`/go/onboarding/${params.userId}/contact-information`, {
    headers: { 'Set-Cookie': await formStepperSessionStorage.commitSession(session) },
  });
}

export default function PersonalInformation({ loaderData }: Route.ComponentProps) {
  const isPending = useIsPending();
  const { activeUserProfile } = useStore();

  const methods = useRemixForm<BasicInformationSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      fullName: activeUserProfile?.full_name || loaderData.fullName,
      username: loaderData.username,
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  console.log('error: ', methods.formState.errors);

  return (
    <RemixFormProvider {...methods}>
      <Form method='POST' onSubmit={methods.handleSubmit}>
        <HoneypotInputs />

        <GoInputField
          labelProps={{ children: 'Your name or company', required: true }}
          name='fullName'
          inputProps={{
            autoFocus: true,
            disabled: isDisabled,
          }}
          description='Let us know who you are, whether it’s just you or your team'
        />

        <GoInputField
          labelProps={{
            children: 'Username',
            required: true,
            endAdornment: isDisabled ? <LoaderCircle size={12} className='animate-spin' /> : null,
          }}
          name='username'
          inputProps={{
            className: 'lowercase',
            disabled: isDisabled,
          }}
          description='Pick something short and memorable... like a handle.'
        />

        <div className='mt-6 flex w-full justify-end'>
          <Button
            type='submit'
            disabled={isDisabled}
            isLoading={isDisabled}
            rightIcon={<ChevronRight />}
          >
            Next
          </Button>
        </div>
      </Form>
    </RemixFormProvider>
  );
}
