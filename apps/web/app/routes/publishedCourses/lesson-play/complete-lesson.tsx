import Confetti from 'react-confetti-boom';
import { redirect } from 'react-router';
import { differenceInMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CheckCircle, NotebookPen } from 'lucide-react';

import {
  fetchLessonOverviewWithChapterProgress,
  getUnifiedNavigation,
} from '@gonasi/database/publishedCourses';

import type { Route } from './+types/complete-lesson';
import { confettiColors } from '../complete-course';

import { NavLinkButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta({ data }: Route.MetaArgs) {
  const lesson = data?.overviewData?.lesson;
  const chapter = data?.overviewData?.chapter;

  const lessonName = lesson?.name ?? 'Lesson';
  const chapterName = chapter?.name ?? 'Chapter';
  const courseProgress = 'Lesson wrapped up';

  return [
    {
      title: `🎉 ${lessonName} Done • Gonasi`,
    },
    {
      name: 'description',
      content: `✅ You just wrapped up "${lessonName}" in ${chapterName}. ${courseProgress}. Keep the streak going! 💪`,
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  console.debug('Loader invoked with params:', params);

  try {
    console.debug('Fetching navigation and lesson overview data...');

    const [navigationData, overviewData] = await Promise.all([
      getUnifiedNavigation({
        supabase,
        courseId: params.publishedCourseId,
        lessonId: params.publishedLessonId,
      }),
      fetchLessonOverviewWithChapterProgress({
        supabase,
        courseId: params.publishedCourseId,
        lessonId: params.publishedLessonId,
      }),
    ]);

    const current = navigationData?.current;

    const canonicalLessonUrl = `/c/${current?.course.id}/${current?.chapter?.id}/${current?.lesson?.id}/play`;

    if (!navigationData) {
      return redirect(canonicalLessonUrl);
    }

    const isNonCanonical =
      params.publishedCourseId !== current?.course?.id ||
      params.publishedLessonId !== current?.lesson?.id;

    if (isNonCanonical) {
      console.warn('Non-canonical lesson URL, redirecting to canonical URL');
      return redirect(canonicalLessonUrl);
    }

    if (current.lesson?.completed_at) {
      const completedAt = new Date(current.lesson.completed_at);
      const now = new Date();
      const minutesAgo = differenceInMinutes(now, completedAt);

      if (minutesAgo > 5) {
        console.warn('Lesson was completed more than 5 minutes ago, redirecting...');
        return redirect(canonicalLessonUrl);
      }
    }

    return {
      navigationData,
      overviewData,
    };
  } catch (error) {
    console.error('Lesson loader error:', error);
    throw error;
  }
}

export default function CompleteLesson({ loaderData, params }: Route.ComponentProps) {
  const { navigationData, overviewData } = loaderData;

  const lessonName = overviewData?.lesson?.name ?? 'this lesson';
  const chapterName = overviewData?.chapter?.name ?? 'this chapter';
  const chapterProgress = Math.round(overviewData?.progress?.progress_percentage ?? 0);
  const courseId = params.publishedCourseId;

  const continueBlock = navigationData?.continue.block;
  const continueLesson = navigationData?.continue.lesson;

  const continueLessonPath = continueLesson
    ? `/c/${continueLesson.course_id}/${continueLesson.chapter_id}/${continueLesson.id}/play`
    : `/c/${courseId}`;

  const continueBlockPath = continueBlock
    ? `/c/${continueBlock.course_id}/${continueBlock.chapter_id}/${continueBlock.lesson_id}/play`
    : `/c/${courseId}`;

  const sameContinueTarget = continueLessonPath === continueBlockPath;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header hasClose={false} className='bg-transparent' />
        <Modal.Body className='px-4 pt-2 pb-8'>
          <Confetti
            particleCount={200}
            colors={confettiColors}
            effectCount={2}
            effectInterval={500}
            launchSpeed={1}
            opacityDeltaMultiplier={1.1}
          />

          <motion.div
            className='mb-6 text-center'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className='mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-800'>
              <span className='text-4xl'>🎉</span>
            </div>
            <motion.h1
              className='px-4 text-2xl font-bold text-green-700 dark:text-green-300'
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Lesson Complete!
            </motion.h1>
            <motion.p
              className='text-md mt-2 px-3 text-green-600 dark:text-green-400'
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <strong>{lessonName}</strong> is officially in the bag. Nicely done!
            </motion.p>
          </motion.div>

          <motion.div
            className='space-y-4'
            initial='hidden'
            animate='visible'
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          >
            {[
              'You’re on a roll! 🎯',
              'Keep the momentum going... your future self will thank you. 🚀',
            ].map((message, index) => (
              <motion.div
                key={index}
                className='flex items-start gap-3'
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <CheckCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-green-500' />
                <p className='text-foreground font-secondary'>{message}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className='bg-card/50 mt-6 rounded-lg p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-foreground text-sm font-medium'>{chapterName}</span>
              <span className='text-foreground text-sm font-medium'>{`${chapterProgress}%`}</span>
            </div>
            <div className='bg-muted-foreground h-2 w-full overflow-hidden rounded-full'>
              <motion.div
                className='h-full rounded-full bg-green-600'
                initial={{ width: 0 }}
                animate={{ width: `${chapterProgress}%` }}
                transition={{ duration: 1.5 }}
              />
            </div>
          </motion.div>

          <div className='mt-6 flex flex-col gap-3'>
            <div className='flex flex-col space-y-4'>
              {!sameContinueTarget && continueBlock && (
                <NavLinkButton
                  className='w-full gap-2'
                  to={continueBlockPath}
                  rightIcon={<ArrowRight />}
                >
                  Jump to next unfinished block
                </NavLinkButton>
              )}

              {continueLesson && (
                <NavLinkButton
                  className='w-full gap-2'
                  variant='secondary'
                  to={continueLessonPath}
                  rightIcon={<NotebookPen />}
                >
                  Continue to next lesson
                </NavLinkButton>
              )}

              <NavLinkButton
                className='w-full gap-2'
                variant='ghost'
                leftIcon={<BookOpen />}
                to={`/c/${courseId}`}
              >
                View chapter progress
              </NavLinkButton>
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
