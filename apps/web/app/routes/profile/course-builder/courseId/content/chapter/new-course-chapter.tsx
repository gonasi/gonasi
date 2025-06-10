import { Form, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createCourseChapter } from '@gonasi/database/courseChapters';
import { NewChapterSchema, type NewChapterSchemaTypes } from '@gonasi/schemas/courseChapters';

import type { Route } from './+types/new-course-chapter';

import { Button } from '~/components/ui/button';
import { GoInputField, GoTextAreaField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Meta info for the route
export function meta() {
  return [
    { title: 'Add a New Course Chapter | Gonasi Course Builder' },
    {
      name: 'description',
      content:
        'Create a new chapter for your course on Gonasi. Add a title, description, and configure whether the chapter requires payment. Enhance your course structure and guide learners effectively.',
    },
  ];
}

const resolver = zodResolver(NewChapterSchema);

// Handles form submission
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Anti-bot honeypot check
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  // Validate form data with Zod schema
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<NewChapterSchemaTypes>(formData, resolver);

  // If validation fails, return errors and user-entered values
  if (errors) {
    return { errors, defaultValues };
  }

  // Create the chapter in the DB
  const { success, message } = await createCourseChapter(supabase, {
    ...data,
    courseId: params.courseId,
  });

  // Return success or error response
  return success
    ? redirectWithSuccess(`/${params.username}/course-builder/${params.courseId}/content`, message)
    : dataWithError(null, message);
}

// UI component for creating a new course chapter
export default function NewCourseChapter() {
  const params = useParams();

  const isPending = useIsPending();

  const methods = useRemixForm<NewChapterSchemaTypes>({
    mode: 'all',
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Add a new chapter'
          closeRoute={`/${params.username}/course-builder/${params.courseId}/content`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              {/* Bot trap field */}
              <HoneypotInputs />

              {/* Chapter title */}
              <GoInputField
                labelProps={{ children: 'Chapter title', required: true }}
                name='name'
                inputProps={{ autoFocus: true, disabled: isDisabled }}
                description='Give your chapter a short, clear name.'
              />

              {/* Chapter description */}
              <GoTextAreaField
                name='description'
                labelProps={{ children: 'What’s this chapter about?', required: true }}
                textareaProps={{ disabled: isDisabled }}
                description='Just a quick overview to help learners know what to expect.'
              />

              {/* Submit button */}
              <Button type='submit' disabled={isPending} isLoading={isPending}>
                Create chapter
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
