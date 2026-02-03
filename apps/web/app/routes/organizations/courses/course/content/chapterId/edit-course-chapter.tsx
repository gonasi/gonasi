import { Form, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editCourseChapterById, fetchUserCourseChapterById } from '@gonasi/database/courseChapters';
import { fetchCoursePricing } from '@gonasi/database/courses';
import { EditChapterSchema, type EditChapterSchemaTypes } from '@gonasi/schemas/courseChapters';

import type { Route } from './+types/edit-course-chapter';

import { Button } from '~/components/ui/button';
import { GoInputField, GoTextAreaField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Page metadata
export function meta() {
  return [
    { title: 'Edit Chapter • Gonasi Course Builder' },
    {
      name: 'description',
      content:
        'Update the title and description of your course chapter on Gonasi. Keep your content fresh and helpful for learners.',
    },
  ];
}

// Zod schema resolver
const resolver = zodResolver(EditChapterSchema);

// Loader: fetch chapter, pricing info, and permission
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [chapter, pricingData, canEdit] = await Promise.all([
    fetchUserCourseChapterById(supabase, params.chapterId),
    fetchCoursePricing({ supabase, courseId: params.courseId }),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canEdit) {
    return redirectWithError(
      `/${params.organizationId}/courses/${params.courseId}/content`,
      'You don’t have permission to edit this course.',
    );
  }

  if (!chapter) {
    return redirectWithError(
      `/${params.organizationId}/courses/${params.courseId}/content`,
      'The chapter you’re looking for doesn’t exist.',
    );
  }

  const isPaid = Array.isArray(pricingData)
    ? pricingData.some((item) => item.is_free === false)
    : false;

  return { chapter, isPaid };
}

// Action: handle form submission and chapter update
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditChapterSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  const { success, message } = await editCourseChapterById(supabase, {
    ...data,
    chapterId: params.chapterId,
    organizationId: params.organizationId,
  });

  return success
    ? redirectWithSuccess(`/${params.organizationId}/courses/${params.courseId}/content`, message)
    : dataWithError(null, message);
}

// UI: Edit chapter form in modal
export default function EditCourseChapter({ loaderData }: Route.ComponentProps) {
  const params = useParams();
  const isPending = useIsPending();

  const {
    chapter: { name, description },
  } = loaderData;

  const methods = useRemixForm<EditChapterSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      name,
      description: description ?? '',
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  const closeRoute = `/${params.organizationId}/courses/${params.courseId}/content`;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header title='Edit Chapter' closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              {/* Chapter title field */}
              <GoInputField
                name='name'
                labelProps={{ children: 'Chapter Title', required: true }}
                inputProps={{ autoFocus: true, disabled: isDisabled }}
                description='Give your chapter a concise, clear title learners will recognize.'
              />

              {/* Chapter description field */}
              <GoTextAreaField
                name='description'
                labelProps={{ children: 'What’s This Chapter About?', required: true }}
                textareaProps={{ disabled: isDisabled }}
                description='Provide a quick summary to help learners understand what this chapter covers.'
              />

              {/* Save button */}
              <Button
                type='submit'
                disabled={isDisabled || !methods.formState.isDirty}
                isLoading={isDisabled}
              >
                Save Changes
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
