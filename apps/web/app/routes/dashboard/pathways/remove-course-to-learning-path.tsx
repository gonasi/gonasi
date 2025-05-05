import { data, Form, useNavigate } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { CircleAlert, Trash2 } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchCourseByPathwayId, removeCourseFromLearningPath } from '@gonasi/database/courses';
import { RemoveCourseToLearningPathSchema } from '@gonasi/schemas/learningPaths';

import type { Route } from './+types/remove-course-to-learning-path';

import { Button } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const learningPath = await fetchCourseByPathwayId(
    supabase,
    params.courseId,
    params.learningPathId,
  );

  if (learningPath === null)
    return redirectWithError(
      `/dashboard/${params.companyId}/learning-paths/${params.learningPathId}`,
      'Learning path does not exist',
    );

  return data(learningPath);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: RemoveCourseToLearningPathSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await removeCourseFromLearningPath(supabase, {
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

export default function DeleteCourseToLearningPath({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'remove-course-to-learning-path-form',
    constraint: getZodConstraint(RemoveCourseToLearningPathSchema),
    lastResult: actionData?.result,
    defaultValue: {
      courseId: params.courseId,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: RemoveCourseToLearningPathSchema });
    },
  });

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/learning-paths/${params.learningPathId}`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <Input {...getInputProps(fields.courseId, { type: 'text' })} hidden />
            <ErrorList errors={form.errors} id={form.errorId} />
            <div>
              <div className='flex items-center justify-center pb-4'>
                <CircleAlert className='text-warning h-12 w-12' />
              </div>
              <h2 className='font-secondary text-muted-foreground text-center'>
                Are you sure you want to remove course{' '}
                <span className='font-primary text-foreground'>{loaderData.name}</span> from the
                learning path?
              </h2>
            </div>
            <div className='flex flex-col space-y-4 pt-4'>
              <Button
                type='submit'
                disabled={isPending}
                isLoading={isPending}
                variant='warning'
                rightIcon={<Trash2 />}
              >
                Remove
              </Button>
              <Button type='button' disabled={isPending} variant='ghost' onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
