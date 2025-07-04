import { data, Form, redirect, useNavigate } from 'react-router';
import { getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchUserCoursesAsSelectOptions } from '@gonasi/database/courses';
import { addCourseToLearningPath, checkUserOwnsPathway } from '@gonasi/database/learningPaths';
import { AddCourseToLearningPathSchema } from '@gonasi/schemas/learningPaths';

import type { Route } from './+types/add-course-to-learning-path';

import { GoLink } from '~/components/go-link';
import { Button } from '~/components/ui/button';
import { ErrorList, SearchDropdownField } from '~/components/ui/forms';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta({ data }: { data: { title?: string; description?: string } }) {
  return [
    { title: data?.title ? `${data.title} • Gonasi` : 'Gonasi' },
    {
      name: 'description',
      content: data?.description || 'Easily build and customize your learning paths with Gonasi.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  if (!(await checkUserOwnsPathway(supabase, params.learningPathId))) {
    return redirect(`/dashboard/${params.companyId}/learning-paths/${params.learningPathId}`);
  }

  return data(await fetchUserCoursesAsSelectOptions(supabase, params.learningPathId));
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: AddCourseToLearningPathSchema });

  if (submission.status !== 'success') {
    return {
      result: submission.reply(),
      status: submission.status === 'error' ? 400 : 200,
    };
  }

  const { success, message } = await addCourseToLearningPath(supabase, {
    ...submission.value,
    learningPathId: params.learningPathId,
  });

  return success
    ? redirectWithSuccess(
        `/dashboard/${params.companyId}/learning-paths/${params.learningPathId}`,
        message,
      )
    : dataWithError(null, message);
}

export default function AddCourseToLearningPath({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'add-course-to-learning-path-form',
    constraint: getZodConstraint(AddCourseToLearningPathSchema),
    lastResult: actionData?.result,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: AddCourseToLearningPathSchema });
    },
  });

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/learning-paths/${params.learningPathId}`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Add Course to Path' />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <SearchDropdownField
              labelProps={{
                children: 'Select a course',
                required: true,
                endAdornment: (
                  <GoLink to={`/dashboard/${params.companyId}/courses/new`}>
                    Create new course
                  </GoLink>
                ),
              }}
              searchDropdownProps={{
                meta: fields.courseId,
                disabled: isPending,
                options: loaderData,
              }}
              errors={fields.courseId?.errors}
              description='Choose a course to include in this learning path.'
            />
            <ErrorList errors={form.errors} id={form.errorId} />
            <Button type='submit' disabled={isPending} isLoading={isPending}>
              Add Course
            </Button>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
