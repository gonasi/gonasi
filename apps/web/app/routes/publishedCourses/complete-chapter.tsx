import { useEffect } from 'react';
import Confetti from 'react-confetti-boom';
import { redirect } from 'react-router';
import { differenceInMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

import {
  fetchChapterOverviewWithCourseProgress,
  getUnifiedNavigation,
} from '@gonasi/database/publishedCourses';

import type { Route } from './+types/complete-chapter';
import { confettiColors } from './complete-course';

import chapterCompleteSound from '/assets/sounds/chapter-complete.mp3';
import { LucideIconRenderer } from '~/components/cards';
import { NavLinkButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

export function meta({ data }: Route.MetaArgs) {
  const chapter = data?.overviewData?.chapter;
  return [
    {
      title: `🎉 ${chapter?.name ?? 'Chapter'} Done • Gonasi`,
    },
    {
      name: 'description',
      content: `✅ You just completed "${chapter?.name}". Keep pushing forward! 🚀`,
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [navigationData, overviewData] = await Promise.all([
    getUnifiedNavigation({
      supabase,
      courseId: params.publishedCourseId,
      chapterId: params.completedChapterId,
    }),
    fetchChapterOverviewWithCourseProgress({
      supabase,
      courseId: params.publishedCourseId,
      chapterId: params.completedChapterId,
    }),
  ]);

  const current = navigationData?.current;
  const canonicalChapterUrl = `/c/${current?.course.id}/${current?.chapter?.id}/complete`;

  if (!navigationData) {
    return redirect(canonicalChapterUrl);
  }

  const isNonCanonical =
    params.publishedCourseId !== current?.course?.id ||
    params.completedChapterId !== current?.chapter?.id;

  if (isNonCanonical) {
    return redirect(canonicalChapterUrl);
  }

  // Time-bound redirect: if chapter was completed more than 5 minutes ago, redirect
  if (current.chapter?.completed_at) {
    const completedAt = new Date(current.chapter.completed_at);
    const now = new Date();
    const minutesAgo = differenceInMinutes(now, completedAt);
    if (minutesAgo > 5) {
      return redirect(canonicalChapterUrl);
    }
  }

  return {
    navigationData,
    overviewData,
  };
}

// Create Howl instance outside component to avoid recreation on every render
const chapterCompleteHowl = new Howl({
  src: [chapterCompleteSound],
  volume: 0.5,
  preload: true, // Preload for better performance
});

export default function CompleteChapter({ loaderData, params }: Route.ComponentProps) {
  const { overviewData } = loaderData;
  const { isSoundEnabled } = useStore();

  const chapterName = overviewData?.chapter?.name ?? 'this chapter';
  const chapterProgress = Math.round(overviewData?.progress?.progress_percentage ?? 0);
  const courseId = params.publishedCourseId;

  useEffect(() => {
    if (isSoundEnabled) {
      chapterCompleteHowl.play();
    }
  }, [isSoundEnabled]);

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header hasClose={false} className='bg-transparent' />
        <Modal.Body className='px-4 pt-2 pb-8'>
          <Confetti
            mode='boom'
            particleCount={180}
            colors={confettiColors}
            x={0.5}
            y={0.4}
            deg={270}
            shapeSize={14}
            spreadDeg={65}
            effectCount={5}
            effectInterval={800}
            launchSpeed={1.3}
            opacityDeltaMultiplier={1.1}
          />

          <motion.div
            className='mb-6 text-center'
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className='mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-800'>
              <span className='text-4xl'>🏆</span>
            </div>

            <motion.h1
              className='px-4 text-2xl font-bold text-green-700 dark:text-green-300'
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              You nailed it!
            </motion.h1>

            <motion.p
              className='text-md text-muted-foreground mt-2 px-4'
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <strong>{chapterName}</strong> is now complete. Keep the momentum going!
            </motion.p>
          </motion.div>

          <motion.div
            className='bg-card/50 max-h-48 space-y-4 overflow-y-auto rounded-lg p-3'
            initial='hidden'
            animate='visible'
            variants={{
              visible: {
                transition: { staggerChildren: 0.1, delayChildren: 0.3 },
              },
            }}
          >
            {overviewData?.chapter.lessons.map((lesson, index) => (
              <motion.div
                key={index}
                className='flex items-start gap-3'
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                initial='hidden'
                animate='visible'
                transition={{ duration: 0.3 }}
              >
                <LucideIconRenderer
                  name={lesson.lesson_types.lucide_icon}
                  aria-hidden
                  color={lesson.lesson_types.bg_color}
                  className='shrink-0 rotate-[30deg] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-0'
                />

                <p className='text-muted-foreground font-secondary'>{lesson.name}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className='bg-card/50 mt-6 rounded-lg p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Course Progress</span>
              <span className='text-muted-foreground text-sm'>{`${chapterProgress}%`}</span>
            </div>
            <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
              <motion.div
                className='h-full rounded-full bg-green-600'
                initial={{ width: 0 }}
                animate={{ width: `${chapterProgress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          <div className='mt-6 flex flex-col gap-3'>
            <NavLinkButton className='w-full gap-2' leftIcon={<BookOpen />} to={`/c/${courseId}`}>
              Back to course
            </NavLinkButton>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
