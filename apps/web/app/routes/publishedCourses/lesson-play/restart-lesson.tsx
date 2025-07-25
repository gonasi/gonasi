import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, RotateCcw } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { restartLesson } from '@gonasi/database/publishedCourses';
import { ResetLessonSchema, type ResetLessonSchemaTypes } from '@gonasi/schemas/lessons';

import type { Route } from './+types/restart-lesson';

import { Button, NavLinkButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(ResetLessonSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) return dataWithError(null, 'Something went wrong. Please try again.');

  const { supabase } = createClient(request);
  const { success, message: resultMessage } = await restartLesson({ supabase, ...data });

  return success
    ? redirectWithSuccess(
        `/c/${params.publishedCourseId}/${params.publishedChapterId}/${params.publishedLessonId}/play`,
        resultMessage,
      )
    : dataWithError(null, resultMessage);
}

export default function RestartLesson({ params }: Route.ComponentProps) {
  const isPending = useIsPending();

  const methods = useRemixForm<ResetLessonSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: { lessonId: params.publishedLessonId },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;
  const closeLink = `/c/${params.publishedCourseId}/${params.publishedChapterId}/${params.publishedLessonId}/play`;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={closeLink} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <div>
                <div className='flex items-center justify-center pb-4'>
                  <CircleAlert className='text-warning h-12 w-12' />
                </div>
                <h2 className='font-secondary text-muted-foreground text-center'>
                  Reset lesson progress?
                </h2>
                <p className='font-secondary text-muted-foreground pt-2 text-center text-xs'>
                  This will permanently delete all progress for this lesson.
                </p>
                <div className='flex flex-col space-y-4 pt-4'>
                  <Button
                    type='submit'
                    disabled={isDisabled}
                    isLoading={isPending}
                    variant='warning'
                    rightIcon={<RotateCcw />}
                  >
                    Reset Progress
                  </Button>
                  <div className='w-full'>
                    <NavLinkButton
                      to={closeLink}
                      variant='ghost'
                      disabled={isPending}
                      className='w-full'
                    >
                      Cancel
                    </NavLinkButton>
                  </div>
                </div>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
