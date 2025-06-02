import { Form, useNavigate, useOutletContext, useParams } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editCourseDetails } from '@gonasi/database/courses';
import { EditCourseDetailsSchema } from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-details';
import type { CourseOverviewType } from './course-by-id';

import { Button } from '~/components/ui/button';
import { ErrorList, Field, TextareaField } from '~/components/ui/forms';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = await createClient(request);
  const submission = parseWithZod(formData, { schema: EditCourseDetailsSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editCourseDetails(supabase, {
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

export default function EditCourseDetails({ actionData }: Route.ComponentProps) {
  const { name, description, monthly_subscription_price } =
    useOutletContext<CourseOverviewType>() ?? {};

  const courseDetailsDefaults = {
    name,
    description,
    monthlySubscriptionPrice: monthly_subscription_price,
  };

  const isPending = useIsPending();
  const navigate = useNavigate();
  const params = useParams();

  const [form, fields] = useForm({
    id: 'edit-course-details-form',
    constraint: getZodConstraint(EditCourseDetailsSchema),
    defaultValue: courseDetailsDefaults,
    lastResult: actionData?.result,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditCourseDetailsSchema });
    },
  });

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-details`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Edit Course Details' />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <Field
              labelProps={{ children: 'Course Title', required: true }}
              inputProps={{ ...getInputProps(fields.name, { type: 'text' }), disabled: isPending }}
              errors={fields.name?.errors}
              description='Enter the course title.'
            />
            <TextareaField
              labelProps={{ children: 'Course Description', required: true }}
              textareaProps={{
                ...getInputProps(fields.description, { type: 'text' }),
                disabled: isPending,
              }}
              errors={fields.description?.errors}
              description='Provide a brief course description.'
            />
            <Field
              prefix='KES'
              labelProps={{ children: 'Monthly Subscription Price', required: true }}
              inputProps={{
                ...getInputProps(fields.monthlySubscriptionPrice, { type: 'number' }),
                disabled: isPending,
              }}
              errors={fields.monthlySubscriptionPrice?.errors}
              description='Specify the monthly subscription fee. 0 if course is free.'
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
