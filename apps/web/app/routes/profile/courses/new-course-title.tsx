// Imports
import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createNewCourseTitle } from '@gonasi/database/courses';
import { NewCourseTitleSchema, type NewCourseTitleSchemaTypes } from '@gonasi/schemas/courses';

import type { Route } from './+types/new-course-title';

import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Setup resolver using Zod schema
const resolver = zodResolver(NewCourseTitleSchema);

// SEO meta function
export function meta() {
  return [
    { title: 'Create a New Course | Gonasi' },
    {
      name: 'description',
      content:
        'Create and manage courses on Gonasi. Organize your curriculum efficiently with structured course titles.',
    },
  ];
}

// Form submission handler
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Honeypot bot check
  await checkHoneypot(formData);

  // Supabase client for database interaction
  const { supabase } = createClient(request);

  // Validate form data using Zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<NewCourseTitleSchemaTypes>(formData, resolver);

  if (errors) {
    // Return validation errors to the client
    return { errors, defaultValues };
  }

  // Attempt to create the course title in the database
  const {
    success,
    message,
    data: submissionData,
  } = await createNewCourseTitle(supabase, {
    ...data,
    username: params.username,
  });

  if (!success || !submissionData) {
    return dataWithError(null, message);
  }

  // Redirect to course details page on success
  return redirectWithSuccess(
    `/dashboard/${params.username}/courses/${submissionData.id}/course-details`,
    message,
  );
}

// Page component
export default function NewCourseTitle({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  // Hook form setup with validation
  const methods = useRemixForm<NewCourseTitleSchemaTypes>({
    mode: 'all',
    resolver,
  });

  // Modal close handler
  const handleClose = () => navigate(`/${params.username}`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='md'>
        <Modal.Header title="Let's build your course 🛠️" />
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
                  disabled: isPending,
                }}
                description='Pick a name that clearly describes what your course is about. Make it catchy!'
              />
              <Button type='submit' disabled={isPending} isLoading={isPending}>
                Save & Continue
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
