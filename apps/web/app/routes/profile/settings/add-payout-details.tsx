import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createNewCourseTitle } from '@gonasi/database/courses';
import { NewCourseTitleSchema, type NewCourseTitleSchemaTypes } from '@gonasi/schemas/courses';

import type { Route } from './+types/add-payout-details';

import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// SEO metadata
export function meta() {
  return [
    { title: 'Set Up How You Get Paid | Gonasi' },
    {
      name: 'description',
      content:
        'Just a few details and you’re all set to get paid! Add your payout info so we can send earnings your way.',
    },
  ];
}

// Zod resolver for validation
const resolver = zodResolver(NewCourseTitleSchema);

// Server-side form submission handler
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Bot protection
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  // Validate form data
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<NewCourseTitleSchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  // Create course title in DB
  const result = await createNewCourseTitle(supabase, data);

  if (!result.success || !result.data) {
    return dataWithError(null, result.message);
  }

  // Redirect to course overview
  return redirectWithSuccess(
    `/${params.username}/course-builder/${result.data.id}/overview`,
    result.message,
  );
}

export default function AddPayoutDetails({ params }: Route.ComponentProps) {
  const isSubmitting = useIsPending();

  const methods = useRemixForm<NewCourseTitleSchemaTypes>({
    mode: 'all',
    resolver,
  });

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Add Payout Details'
          closeRoute={`/${params.username}/settings/payout-settings`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <GoInputField
                name='name'
                labelProps={{ children: 'What’s the course called?' }}
                inputProps={{
                  autoFocus: true,
                  placeholder: 'e.g. Digital Marketing 101',
                  disabled: isSubmitting,
                }}
                description='Pick a name that clearly describes what your course is about. Make it catchy!'
              />
              <Button
                type='submit'
                disabled={isSubmitting}
                isLoading={isSubmitting}
                rightIcon={<ChevronRight />}
              >
                Save & Continue
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
