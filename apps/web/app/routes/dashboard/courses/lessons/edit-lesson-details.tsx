import { data, Form, useNavigate, useParams } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editLessonDetails, fetchUserLessonById } from '@gonasi/database/lessons';
import { fetchLessonTypesAsSelectOptions } from '@gonasi/database/lessonTypes';
import { EditLessonDetailsSchema } from '@gonasi/schemas/lessons';

import type { Route } from './+types/edit-lesson-details';

import { Button } from '~/components/ui/button';
import { Field, SearchDropdownField } from '~/components/ui/forms';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lesson, lessonTypes] = await Promise.all([
    fetchUserLessonById(supabase, params.lessonId),
    fetchLessonTypesAsSelectOptions(supabase),
  ]);

  if (lesson === null) {
    return redirectWithError(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
      'Learning path not exist',
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
  const submission = parseWithZod(formData, { schema: EditLessonDetailsSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editLessonDetails(supabase, {
    ...submission.value,
    lessonId: params.lessonId,
  });

  if (!success) {
    return dataWithError(null, message);
  }

  return redirectWithSuccess(
    `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
    message,
  );
}

export default function EditLessonDetails({ loaderData, actionData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const params = useParams();

  const { lesson, lessonTypes } = loaderData;

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-content`);

  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'edit-course-chapter-lesson-title-form',
    constraint: getZodConstraint(EditLessonDetailsSchema),
    lastResult: actionData?.result,
    defaultValue: {
      name: lesson.name,
      lessonType: lesson.lessonType ?? '',
    },
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditLessonDetailsSchema });
    },
  });

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Edit Title' />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <Field
              labelProps={{ children: 'Lesson Title', required: true }}
              inputProps={{ ...getInputProps(fields.name, { type: 'text' }), disabled: isPending }}
              errors={fields.name?.errors}
              description='Enter the lesson title.'
            />
            <SearchDropdownField
              labelProps={{ children: 'Lesson type', required: true }}
              searchDropdownProps={{
                meta: fields.lessonType,
                disabled: isPending,
                options: lessonTypes,
              }}
              errors={fields.lessonType?.errors}
              description='Choose the most relevant lesson type from the list.'
            />
            <div className='pt-4'>
              <Button type='submit' disabled={isPending} isLoading={isPending}>
                Save
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
