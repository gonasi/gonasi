import { data, Form, useNavigate, useParams } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteUserChapterById, fetchUserCourseChapterById } from '@gonasi/database/courseChapters';
import { DeleteChapterSchema } from '@gonasi/schemas/courseChapters';

import type { Route } from './+types/delete-course-chapter';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { Input } from '~/components/ui/input';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const chapter = await fetchUserCourseChapterById(supabase, params.chapterId);

  if (chapter === null)
    return redirectWithError(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
      'Chapter path not exist',
    );

  return data(chapter);
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: DeleteChapterSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await deleteUserChapterById(supabase, {
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

export default function DeleteCourseChapter({ loaderData, actionData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const params = useParams();

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-content`);

  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'delete-course-chapter-form',
    constraint: getZodConstraint(DeleteChapterSchema),
    lastResult: actionData?.result,
    defaultValue: {
      chapterId: loaderData.id,
    },
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: DeleteChapterSchema });
    },
  });

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <Input {...getInputProps(fields.chapterId, { type: 'text' })} hidden />
            <DeleteConfirmationLayout
              titlePrefix='course chapter: '
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
