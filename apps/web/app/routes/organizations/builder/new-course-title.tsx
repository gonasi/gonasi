import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
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

// SEO metadata
export function meta() {
  return [
    { title: 'Create a New Course • Gonasi' },
    {
      name: 'description',
      content:
        'Create and manage courses on Gonasi. Organize your curriculum efficiently with structured course titles.',
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
  const result = await createNewCourseTitle({ supabase, data });

  if (!result.success || !result.data) {
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(`/${params.organizationId}/builder/${result.data.id}`, result.message);
}

// Component: New Course Title Modal
export default function NewCourseTitle({ params }: Route.ComponentProps) {
  const isSubmitting = useIsPending();

  const methods = useRemixForm<NewCourseTitleSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      organizationId: params.organizationId,
    },
  });

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title="Let's build your course 🛠️"
          closeRoute={`/${params.organizationId}/builder`}
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
