import { data, Form, useNavigate } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { CircleAlert, RotateCcw } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchLessonById, resetBlockInteractionsByLesson } from '@gonasi/database/lessons';
import { ResetLessonSchema } from '@gonasi/schemas/lessons';

import type { Route } from './+types/go-lesson-restart';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: ResetLessonSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await resetBlockInteractionsByLesson(
    supabase,
    submission.value.lessonId,
  );

  return success
    ? redirectWithSuccess(
        `/go/course/${params.courseId}/${params.chapterId}/${params.lessonId}/play`,
        message,
      )
    : dataWithError(null, message);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const lesson = await fetchLessonById(supabase, params.lessonId);

  if (lesson === null)
    return redirectWithError(
      `/go/course/${params.courseId}/${params.chapterId}/${params.lessonId}/play`,
      'Learning path not exist',
    );

  return data(lesson);
}

export default function GoLessonRestart({ loaderData, actionData, params }: Route.ComponentProps) {
  const isPending = useIsPending();
  const navigate = useNavigate();

  const [form, fields] = useForm({
    id: 'reset-lesson-progress-form',
    constraint: getZodConstraint(ResetLessonSchema),
    lastResult: actionData?.result,
    defaultValue: {
      lessonId: loaderData.id,
    },
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ResetLessonSchema });
    },
  });

  const handleClose = () =>
    navigate(`/go/course/${params.courseId}/${params.chapterId}/${params.lessonId}/play`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <Input {...getInputProps(fields.lessonId, { type: 'text' })} hidden />
            <div>
              <div className='flex items-center justify-center pb-4'>
                <CircleAlert className='text-warning h-12 w-12' />
              </div>
              <h2 className='font-secondary text-muted-foreground text-center'>
                Are you sure you want to reset lesson{' '}
                <span className='font-primary text-foreground'>{loaderData.name}?</span>
              </h2>
              <p className='font-secondary text-muted-foreground pt-2 text-center text-xs'>
                All progress will be lost
              </p>
              <div className='flex flex-col space-y-4 pt-4'>
                <Button
                  type='submit'
                  disabled={isPending}
                  isLoading={isPending}
                  variant='warning'
                  rightIcon={<RotateCcw />}
                >
                  Reset
                </Button>
                <Button type='button' disabled={isPending} variant='ghost' onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
