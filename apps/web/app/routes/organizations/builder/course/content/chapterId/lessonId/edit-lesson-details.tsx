import { data, Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editLessonDetails, fetchUserLessonById } from '@gonasi/database/lessons';
import { fetchLessonTypesAsSelectOptions } from '@gonasi/database/lessonTypes';
import {
  EditLessonDetailsSchema,
  type EditLessonDetailsSchemaTypes,
} from '@gonasi/schemas/lessons';

import type { Route } from './+types/edit-lesson-details';

import { Button } from '~/components/ui/button';
import { GoInputField, GoSearchableDropDown } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Zod resolver
const resolver = zodResolver(EditLessonDetailsSchema);

// Loader: fetch lesson and type options
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lesson, lessonTypes, canEdit] = await Promise.all([
    fetchUserLessonById(supabase, params.lessonId),
    fetchLessonTypesAsSelectOptions(supabase),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canEdit) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/content/${params.chapterId}/${params.lessonId}/lesson-blocks`,
      'You don’t have permission to edit this lesson.',
    );
  }

  if (!lesson) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/content`,
      'This lesson couldn’t be found or is currently locked.',
    );
  }

  return data({
    lesson: {
      id: lesson.id,
      name: lesson.name,
      lessonType: lesson.lesson_type_id,
    },
    lessonTypes,
  });
}

// Action: handle update form submission
export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditLessonDetailsSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  const result = await editLessonDetails(supabase, {
    ...data,
    lessonId: params.lessonId,
    organizationId: params.organizationId,
  });

  if (!result.success) {
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(
    `/${params.organizationId}/builder/${params.courseId}/content/${params.chapterId}/lessons`,
    result.message,
  );
}

// Component: UI for editing lesson name and type
export default function EditLessonDetails({ loaderData, params }: Route.ComponentProps) {
  const { lesson, lessonTypes } = loaderData;
  const isPending = useIsPending();

  const methods = useRemixForm<EditLessonDetailsSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      name: lesson.name,
      lessonType: lesson.lessonType ?? '',
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Edit Lesson Details'
          closeRoute={`/${params.organizationId}/builder/${params.courseId}/content/${params.chapterId}/lessons`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <GoInputField
                name='name'
                labelProps={{ children: 'Lesson Title', required: true }}
                inputProps={{ autoFocus: true, disabled: isDisabled }}
                description='Give this lesson a clear, helpful title learners will recognize.'
              />

              <GoSearchableDropDown
                name='lessonType'
                labelProps={{ children: 'Lesson Type', required: true }}
                searchDropdownProps={{
                  disabled: isDisabled,
                  options: lessonTypes,
                }}
                description='Choose the type that best describes this lesson.'
              />

              <div className='pt-4'>
                <Button
                  type='submit'
                  disabled={isDisabled || !methods.formState.isDirty}
                  isLoading={isDisabled}
                >
                  Save Changes
                </Button>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
