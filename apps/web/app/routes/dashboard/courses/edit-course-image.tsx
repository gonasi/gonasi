import { Form, useNavigate, useOutletContext, useParams } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editCourseImage } from '@gonasi/database/courses';
import { EditCourseImageSchema } from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-image';
import type { CourseOverviewType } from './course-by-id';

import { Button } from '~/components/ui/button';
import { ErrorList, Field } from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Course Details - Gonasi' },
    { name: 'description', content: 'Explore detailed information about this course on Gonasi.' },
  ];
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: EditCourseImageSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editCourseImage(supabase, {
    ...submission.value,
    courseId: params.courseId,
  });

  return success
    ? redirectWithSuccess(
        `/dashboard/${params.companyId}/courses/${params.courseId}/course-details`,
        message,
      )
    : dataWithError(null, message);
}

export default function EditCourseImage({ actionData }: Route.ComponentProps) {
  const { image_url } = useOutletContext<CourseOverviewType>();

  const defaultValue = {
    image: null,
    imageUrl: image_url,
  };

  const isPending = useIsPending();
  const navigate = useNavigate();
  const params = useParams();

  const [form, fields] = useForm({
    id: 'edit-course-image-form',
    constraint: getZodConstraint(EditCourseImageSchema),
    lastResult: actionData?.result,
    defaultValue,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditCourseImageSchema });
    },
  });

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-details`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Edit course image' />
        <Modal.Body>
          <Form method='POST' encType='multipart/form-data' {...getFormProps(form)}>
            <HoneypotInputs />
            <Field
              labelProps={{ children: 'Course image', required: true }}
              inputProps={{ ...getInputProps(fields.image, { type: 'file' }), disabled: isPending }}
              errors={fields.image?.errors}
              description='Upload an image to visually represent your course'
            />
            <Input {...getInputProps(fields.imageUrl, { type: 'hidden' })} />
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
