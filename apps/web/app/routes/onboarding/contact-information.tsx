import { data, Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { checkUserNameExists, completeUserOnboarding } from '@gonasi/database/onboarding';
import type {
  BasicInformationSchemaTypes,
  CombinedInformationSchemaTypes,
  ContactInformationSchemaTypes,
} from '@gonasi/schemas/onboarding';
import {
  BasicInformationSchema,
  CombinedInformationSchema,
  ContactInformationSchema,
} from '@gonasi/schemas/onboarding';

import type { Route } from './+types/contact-information';

import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
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

const resolver = zodResolver(ContactInformationSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const session = await getFormStepperSessionData(request);

  validateStepData(
    session,
    FORM_STEPPER_COOKIE_NAMES.basicInfo,
    BasicInformationSchema,
    `/go/onboarding/${params.userId}/basic-information`,
  );

  return data({} as ContactInformationSchemaTypes);
}

export async function action({ request, params }: Route.ActionArgs) {
  // Load form session to access previously saved basic info
  const session = await getFormStepperSessionData(request);

  // Extract the basic info step data from the session (e.g., name, username)
  const basicInfo = session.get(FORM_STEPPER_COOKIE_NAMES.basicInfo) as BasicInformationSchemaTypes;

  // Read submitted contact form data (e.g., phone number)
  const formData = await request.formData();

  // Run honeypot bot check (silently fail bots)
  await checkHoneypot(formData);

  // Convert FormData into a plain object
  const contactInfoObj = Object.fromEntries(formData.entries());

  // Merge previous step's data (basic info) with current step (contact info)
  const mergedData = {
    ...basicInfo,
    ...contactInfoObj,
  };

  // Reconstruct a FormData object from merged data to validate with Zod
  const mergedFormData = new FormData();
  for (const [key, value] of Object.entries(mergedData)) {
    mergedFormData.append(key, value as string);
  }

  // Create a Zod resolver that can validate both basic and contact info together
  const mergeResolver = zodResolver(CombinedInformationSchema);

  // Validate the merged form data
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<CombinedInformationSchemaTypes>(mergedFormData, mergeResolver);

  // If validation fails, return errors and values to re-populate the form
  if (errors) {
    return { errors, defaultValues };
  }

  // Create Supabase client to interact with the DB
  const { supabase } = createClient(request);

  // Check if the submitted username already exists in the DB
  const usernameExists = await checkUserNameExists(supabase, data.username);

  if (usernameExists) {
    // If the username is taken, redirect to basic info step with an error toast
    return redirectWithError(
      `/go/onboarding/${params.userId}/basic-information`,
      'That username’s taken — try something else?',
    );
  }

  // Complete onboarding by saving merged user info to DB
  const { success, message } = await completeUserOnboarding(supabase, { ...data });

  // Clean up the form session (no need to keep basic info anymore)
  const response = await deleteFormStepperSessionKey(request, FORM_STEPPER_COOKIE_NAMES.basicInfo);

  if (!success) {
    // If DB update failed, show error toast
    return dataWithError(null, message || 'Something went wrong. Give it another go.');
  }

  // On success, show welcome toast and redirect to homepage
  return redirectWithSuccess('/', 'You’re all set! Welcome aboard 👋', {
    headers: response.headers, // ensure session cookie updates propagate
  });
}

export default function ContactInformation({ loaderData }: Route.ComponentProps) {
  const isPending = useIsPending();

  const methods = useRemixForm<ContactInformationSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      ...loaderData,
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <RemixFormProvider {...methods}>
      <Form method='POST' onSubmit={methods.handleSubmit}>
        <HoneypotInputs />

        <GoInputField
          prefix='+254'
          labelProps={{ children: 'Phone number', required: true }}
          name='phoneNumber'
          inputProps={{
            autoFocus: true,
            disabled: isDisabled,
          }}
          description='Your phone please'
        />

        <Button
          type='submit'
          disabled={isDisabled}
          isLoading={isDisabled}
          rightIcon={<ChevronRight />}
          className='w-full'
        >
          Complete
        </Button>
      </Form>
    </RemixFormProvider>
  );
}
