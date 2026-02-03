import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
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

// Page metadata
export function meta() {
  return [
    { title: 'Create a New Chapter • Gonasi Course Builder' },
    {
      name: 'description',
      content:
        'Add a new chapter to your course on Gonasi. Provide a name and description to guide your learners and keep your content well-organized.',
    },
  ];
}

// Authorization check: only allow users with edit access to continue
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';
  const orgId = params.organizationId ?? '';

  const { data: canEdit, error } = await supabase.rpc('can_user_edit_course', {
    arg_course_id: courseId,
  });

  if (error || !canEdit) {
    return redirectWithError(
      `/${orgId}/courses/${courseId}/content`,
      'You don’t have permission to edit this course.',
    );
  }
  return true;
}

// Zod resolver setup
const resolver = zodResolver(NewChapterSchema);

// Handle form submission
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Honeypot check to prevent bot submissions
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<NewChapterSchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await createCourseChapter(supabase, {
    ...data,
    courseId: params.courseId,
    organizationId: params.organizationId,
  });

  return success
    ? redirectWithSuccess(`/${params.organizationId}/courses/${params.courseId}/content`, message)
    : dataWithError(null, message);
}

// UI: Chapter creation form in modal
export default function NewCourseChapter({ params }: Route.ActionArgs) {
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
          title='Add a New Chapter'
          closeRoute={`/${params.organizationId}/courses/${params.courseId}/content`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <GoInputField
                name='name'
                labelProps={{ children: 'Chapter Title', required: true }}
                inputProps={{ autoFocus: true, disabled: isDisabled }}
                description='Give your chapter a short, meaningful name learners can easily recognize.'
              />

              <GoTextAreaField
                name='description'
                labelProps={{ children: 'What’s This Chapter About?', required: true }}
                textareaProps={{ disabled: isDisabled }}
                description='Write a quick summary to help learners understand what they’ll learn here.'
              />

              <Button
                type='submit'
                disabled={isDisabled}
                isLoading={isDisabled}
                rightIcon={<Plus />}
              >
                Add Chapter
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
