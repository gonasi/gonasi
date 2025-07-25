import { Form, redirect } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertTriangle, TimerReset } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { getUnifiedNavigation, resetCourse } from '@gonasi/database/publishedCourses';
import { ResetCourseSchema, type ResetCourseSchemaTypes } from '@gonasi/schemas/courses';

import type { Route } from './+types/reset-course';

import { Button, NavLinkButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta({ data }: Route.MetaArgs) {
  const course = data?.navigationData.course_info;
  return [
    {
      title: `⏱️ Reset ${course?.name ?? 'Course'} • Gonasi`,
    },
    {
      name: 'description',
      content: `You’re about to reset your progress for "${course?.name}". This action cannot be undone. Ready for a fresh start?`,
    },
  ];
}

const resolver = zodResolver(ResetCourseSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) return dataWithError(null, 'Something went wrong. Please try again.');

  const { supabase } = createClient(request);
  const { success, message: resultMessage } = await resetCourse({ supabase, ...data });

  return success
    ? redirectWithSuccess(`/c/${params.publishedCourseId}`, resultMessage)
    : dataWithError(null, resultMessage);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const navigationData = await getUnifiedNavigation({
    supabase,
    courseId: params.publishedCourseId,
  });

  if (!navigationData) {
    return redirect(`/c/${params.publishedCourseId}`);
  }

  if (!navigationData.completion.course.is_complete) {
    return redirectWithError(
      `/c/${params.publishedCourseId}`,
      'You can only reset your progress after completing the course.',
    );
  }

  return { navigationData };
}

export default function ResetCourse({ loaderData, params }: Route.ComponentProps) {
  const courseName = loaderData.navigationData.course_info.name;

  const isPending = useIsPending();

  const methods = useRemixForm<ResetCourseSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: { courseId: params.publishedCourseId },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header hasClose={false} className='bg-transparent' />
        <Modal.Body className='px-6 pt-0 pb-8 text-center'>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <motion.div
                initial='hidden'
                animate='visible'
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
                className='flex flex-col items-center justify-center gap-4'
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <AlertTriangle className='text-warning h-10 w-10' />
                </motion.div>

                <motion.h2
                  className='text-lg font-semibold'
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                >
                  Reset <span className='text-primary'>{courseName}</span>?
                </motion.h2>

                <motion.p
                  className='text-muted-foreground font-secondary max-w-md text-sm'
                  variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.3 }}
                >
                  You’re about to reset your course progress for{' '}
                  <span className='text-foreground font-medium'>{courseName}</span>.
                  <br />
                </motion.p>

                <motion.p
                  className='font-secondary font-muted-foreground text-xs'
                  variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  This action <strong>cannot be undone</strong>. You’ll have to interact with every
                  lesson again.
                </motion.p>

                <motion.div
                  className='flex w-full justify-between space-x-4'
                  variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ delay: 0.2 }}
                >
                  <div className='w-full'>
                    <NavLinkButton
                      to={`/c/${params.publishedCourseId}`}
                      variant='ghost'
                      className='w-full'
                      disabled={isDisabled}
                    >
                      Cancel
                    </NavLinkButton>
                  </div>

                  <Button
                    variant='danger'
                    type='submit'
                    leftIcon={<TimerReset />}
                    className='w-full'
                    disabled={isDisabled}
                  >
                    Yes, Reset Progress
                  </Button>
                </motion.div>
              </motion.div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
