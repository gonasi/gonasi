import { Form } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createNewCourseTitle } from '@gonasi/database/courses';
import { NewCourseTitleSchema } from '@gonasi/schemas/courses';

import type { Route } from './+types/new-course-title';

import { StepperFormLayout } from '~/components/layouts/stepper/StepperFormLayout';
import { Button } from '~/components/ui/button';
import { ErrorList, Field } from '~/components/ui/forms';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Create a New Course | Gonasi' },
    {
      name: 'description',
      content:
        'Create and manage courses on Gonasi. Organize your curriculum efficiently with structured course titles.',
    },
  ];
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: NewCourseTitleSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message, data } = await createNewCourseTitle(supabase, {
    ...submission.value,
    username: params.username,
  });

  if (!success || !data) {
    return dataWithError(null, message);
  }

  return redirectWithSuccess(
    `/dashboard/${params.username}/courses/${data.id}/course-details`,
    message,
  );
}

export default function NewCourseTitle({ actionData, params }: Route.ComponentProps) {
  const [form, fields] = useForm({
    id: 'new-course-title-form',
    constraint: getZodConstraint(NewCourseTitleSchema),
    lastResult: actionData?.result,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate: ({ formData }) => parseWithZod(formData, { schema: NewCourseTitleSchema }),
  });

  const isPending = useIsPending();

  return (
    <StepperFormLayout
      closeLink={`/${params.username}`}
      desktopTitle='New course'
      mobileTitle='New course'
      username={params.username}
    >
      <Form method='POST' {...getFormProps(form)}>
        <HoneypotInputs />
        <Field
          labelProps={{ children: 'Course Title', required: true }}
          inputProps={{
            ...getInputProps(fields.name, { type: 'text' }),
            autoFocus: true,
            placeholder: 'Enter course title',
            disabled: isPending,
          }}
          errors={fields.name?.errors}
          description='Provide a clear and descriptive title for your course to help students understand its content.'
        />
        <ErrorList errors={form.errors} id={form.errorId} />
        <Button type='submit' disabled={isPending} isLoading={isPending}>
          Save & Continue
        </Button>
      </Form>
    </StepperFormLayout>
  );
}
