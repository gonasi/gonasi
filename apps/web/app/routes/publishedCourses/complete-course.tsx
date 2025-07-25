import Confetti from 'react-confetti-boom';
import { redirect } from 'react-router';
import { differenceInMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

import {
  fetchCourseOverviewWithProgress,
  getUnifiedNavigation,
} from '@gonasi/database/publishedCourses';

import type { Route } from './+types/complete-course';

import { NavLinkButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta({ data }: Route.MetaArgs) {
  const course = data?.overviewData?.course;
  const courseName = course?.name ?? 'Course';
  return [
    {
      title: `🎉 ${courseName} Complete • Gonasi`,
    },
    {
      name: 'description',
      content: `✅ You just completed "${courseName}". Congratulations on finishing the course! 🏅`,
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  try {
    const [navigationData, overviewData] = await Promise.all([
      getUnifiedNavigation({
        supabase,
        courseId: params.publishedCourseId,
      }),
      fetchCourseOverviewWithProgress({
        supabase,
        courseId: params.publishedCourseId,
      }),
    ]);

    const current = navigationData?.current;
    const canonicalCourseUrl = `/c/${current?.course.id}`;

    // if (!navigationData) {
    //   return redirect(canonicalCourseUrl);
    // }

    const isNonCanonical = params.publishedCourseId !== current?.course?.id;

    if (isNonCanonical) {
      return redirect(canonicalCourseUrl);
    }

    // Time-bound redirect: if course was completed more than 5 minutes ago, redirect
    const completedAt = overviewData?.overall_progress?.completed_at;
    if (completedAt) {
      const completedDate = new Date(completedAt);
      const now = new Date();
      const minutesAgo = differenceInMinutes(now, completedDate);
      if (minutesAgo > 5) {
        return redirect(canonicalCourseUrl);
      }
    }

    return {
      navigationData,
      overviewData,
    };
  } catch (error) {
    throw error;
  }
}

export default function CompleteCourse({ loaderData, params }: Route.ComponentProps) {
  const { overviewData } = loaderData;
  const courseName = overviewData?.course?.name ?? 'this course';
  const courseId = params.publishedCourseId;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header hasClose={false} />
        <Modal.Body className='px-4 pt-2 pb-8'>
          <Confetti
            mode='boom'
            particleCount={380}
            colors={['#f74d40', '#20c9d0', '#0f172a', '#ffffff']}
            x={0.5}
            y={0.4}
            deg={270}
            shapeSize={14}
            spreadDeg={65}
            effectCount={10}
            effectInterval={1000}
            launchSpeed={1.3}
            opacityDeltaMultiplier={1.1}
          />

          <motion.div
            className='mb-6 text-center'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className='mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-800'>
              <span className='text-4xl'>🏅</span>
            </div>
            <motion.h1
              className='px-4 text-2xl font-bold text-green-700 dark:text-green-300'
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Course Complete!
            </motion.h1>
            <motion.p
              className='text-md mt-2 px-3 text-green-600 dark:text-green-400'
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <strong>{courseName}</strong> is officially in the bag. Congratulations!
            </motion.p>
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
