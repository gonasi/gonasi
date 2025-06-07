import { data, Form, useNavigate, useParams } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteUserLessonById, fetchUserLessonById } from '@gonasi/database/lessons';
import { DeleteLessonSchema } from '@gonasi/schemas/lessons';

import type { Route } from './+types/delete-lesson';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { Input } from '~/components/ui/input';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const lesson = await fetchUserLessonById(supabase, params.lessonId);

  if (lesson === null)
    return redirectWithError(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
      'Learning path not exist',
    );

  return data(lesson);
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: DeleteLessonSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await deleteUserLessonById(supabase, {
    ...submission.value,
  });

  if (!success) {
    return dataWithError(null, message);
  }

  return redirectWithSuccess(
    `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
    message,
  );
}

export default function DeleteLesson({ loaderData, actionData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const params = useParams();

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-content`);

  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'delete-course-chapter-lesson-form',
    constraint: getZodConstraint(DeleteLessonSchema),
    lastResult: actionData?.result,
    defaultValue: {
      lessonId: loaderData.id,
    },
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: DeleteLessonSchema });
    },
  });

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <Input {...getInputProps(fields.lessonId, { type: 'text' })} hidden />
            <DeleteConfirmationLayout
              titlePrefix='lesson: '
              title={loaderData.name}
              isLoading={isPending}
              handleClose={handleClose}
            />
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
