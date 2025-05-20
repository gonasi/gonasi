import { data, Form, useNavigate, useParams } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createLessonDetails } from '@gonasi/database/lessons';
import { fetchLessonTypesAsSelectOptions } from '@gonasi/database/lessonTypes';
import { NewLessonDetailsSchema } from '@gonasi/schemas/lessons';

import type { Route } from './+types/new-lesson-details';

import { Button } from '~/components/ui/button';
import { Field, SearchDropdownField } from '~/components/ui/forms';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const lessonTypes = await fetchLessonTypesAsSelectOptions(supabase);

  return data(lessonTypes);
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: NewLessonDetailsSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message, data } = await createLessonDetails(supabase, {
    ...submission.value,
    courseId: params.courseId,
    chapterId: params.chapterId,
  });

  if (!success || !data) {
    return dataWithError(null, message);
  }

  return redirectWithSuccess(
    `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${data.id}`,
    message,
  );
}

export default function NewLessonDetails({ actionData, loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const params = useParams();

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-content`);

  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'new-course-chapter-lesson-details-form',
    constraint: getZodConstraint(NewLessonDetailsSchema),
    lastResult: actionData?.result,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: NewLessonDetailsSchema });
    },
  });

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='New Lesson' />
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
                options: loaderData,
              }}
              errors={fields.lessonType?.errors}
              description='Choose the most relevant lesson type from the list.'
            />
            <div className='pt-4'>
              <Button type='submit' disabled={isPending} isLoading={isPending}>
                Save & Continue
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
