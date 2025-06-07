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

const resolver = zodResolver(EditLessonDetailsSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lesson, lessonTypes] = await Promise.all([
    fetchUserLessonById(supabase, params.lessonId),
    fetchLessonTypesAsSelectOptions(supabase),
  ]);

  if (!lesson) {
    return redirectWithError(
      `/${params.username}/course-builder/${params.courseId}/content`,
      'Looks like this lesson’s missing or locked for you.',
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
  });

  if (!result.success) {
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(
    `/${params.username}/course-builder/${params.courseId}/content`,
    result.message,
  );
}

export default function EditLessonDetails({ loaderData }: Route.ComponentProps) {
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
          title='Edit lesson title & type'
          closeRoute={`/${loaderData.lesson.id}/course-builder/${loaderData.lesson.id}/content`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <GoInputField
                name='name'
                labelProps={{ children: 'Lesson Title', required: true }}
                inputProps={{ autoFocus: true, disabled: isDisabled }}
                description='Enter the lesson title.'
              />
              <GoSearchableDropDown
                name='lessonType'
                labelProps={{ children: 'Lesson type', required: true }}
                searchDropdownProps={{
                  disabled: isDisabled,
                  options: lessonTypes,
                }}
                description="Pick what best fits the lesson you're making."
              />
              <div className='pt-4'>
                <Button type='submit' disabled={isDisabled} isLoading={isDisabled}>
                  Save
                </Button>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
