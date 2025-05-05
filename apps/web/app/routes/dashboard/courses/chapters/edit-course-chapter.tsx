import { data, Form, useNavigate, useParams } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editCourseChapterById, fetchUserCourseChapterById } from '@gonasi/database/courseChapters';
import { EditChapterSchema } from '@gonasi/schemas/courseChapters';

import type { Route } from './+types/edit-course-chapter';

import { Button } from '~/components/ui/button';
import { CheckboxField, ErrorList, Field, TextareaField } from '~/components/ui/forms';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const chapter = await fetchUserCourseChapterById(supabase, params.chapterId);

  if (chapter === null)
    return redirectWithError(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
      'Chapter path not exist',
    );

  return data({
    ...chapter,
    requiresPayment: chapter.requires_payment,
  });
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: EditChapterSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editCourseChapterById(supabase, {
    ...submission.value,
    chapterId: params.chapterId,
  });

  return success
    ? redirectWithSuccess(
        `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
        message,
      )
    : dataWithError(null, message);
}

export default function EditCourseChapter({ loaderData, actionData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const params = useParams();

  const [form, fields] = useForm({
    id: 'edit-course-chapter-form',
    constraint: getZodConstraint(EditChapterSchema),
    shouldValidate: 'onInput',
    lastResult: actionData?.result,
    defaultValue: loaderData,
    shouldRevalidate: 'onInput',
    onValidate: ({ formData }) => parseWithZod(formData, { schema: EditChapterSchema }),
  });

  const isPending = useIsPending();

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-content`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Edit course chapter' />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <Field
              labelProps={{ children: 'Title', required: true }}
              inputProps={{
                ...getInputProps(fields.name, { type: 'text' }),
                autoFocus: true,
                placeholder: 'Enter chapter title',
                disabled: isPending,
              }}
              errors={fields.name?.errors}
              description='Provide a title for this chapter.'
            />
            <TextareaField
              labelProps={{ children: 'Chapter Description', required: true }}
              textareaProps={{
                ...getInputProps(fields.description, { type: 'text' }),
                disabled: isPending,
              }}
              errors={fields.description?.errors}
              description="Give a brief overview of the chapter's content."
            />
            <CheckboxField
              labelProps={{ children: 'Paid Chapter?', required: true }}
              buttonProps={getInputProps(fields.requiresPayment, {
                type: 'checkbox',
              })}
              errors={fields.requiresPayment.errors}
              description='Enable the above option if users must pay to access this chapter.'
            />
            <ErrorList errors={form.errors} id={form.errorId} />
            <Button type='submit' disabled={isPending} isLoading={isPending}>
              Save Changes
            </Button>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
