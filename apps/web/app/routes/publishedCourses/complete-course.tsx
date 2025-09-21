import { useEffect, useState } from 'react';
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

import courseCompleteSound from '/assets/sounds/course-complete.mp3';
import { NavLinkButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

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

    if (!navigationData || !navigationData.completion.course.is_complete) {
      return redirect(`/c/${params.publishedCourseId}`);
    }

    // Time-bound redirect: if course was completed more than 5 minutes ago, redirect
    const completedAt = overviewData?.overall_progress?.completed_at;

    if (completedAt) {
      const completedDate = new Date(completedAt);
      const now = new Date();
      const minutesAgo = differenceInMinutes(now, completedDate);
      if (minutesAgo > 5) {
        return redirect(`/c/${params.publishedCourseId}`);
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

export const confettiColors = [
  // Theme colors
  '#f74d40', // red-orange
  '#20c9d0', // cyan
  '#0f172a', // slate/dark
  '#ffffff', // white

  // Additions for visual contrast and vibrancy
  '#facc15', // amber/yellow
  '#4ade80', // green-400
  '#a855f7', // purple-500
  '#3b82f6', // blue-500
  '#fb923c', // orange-400
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f472b6', // rose-400
];

// Create Howl instance outside component to avoid recreation on every render
const courseCompleteHowl = new Howl({
  src: [courseCompleteSound],
  volume: 0.5,
  preload: true, // Preload for better performance
});

export default function CompleteCourse({ loaderData, params }: Route.ComponentProps) {
  const { overviewData } = loaderData;
  const { isSoundEnabled } = useStore();

  const courseName = overviewData?.course?.name ?? 'this course';
  const courseId = params.publishedCourseId;

  const [confettiBursts, setConfettiBursts] = useState<
    {
      id: string;
      x: number;
      y: number;
      deg: number;
      shapeSize: number;
      spreadDeg: number;
      launchSpeed: number;
      opacityDeltaMultiplier: number;
      createdAt: number;
    }[]
  >([]);

  useEffect(() => {
    if (isSoundEnabled) {
      courseCompleteHowl.play();
    }
  }, [isSoundEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const lifetime = 5000; // keep bursts alive for 5 seconds

      setConfettiBursts((prev) => {
        // filter out old bursts
        const fresh = prev.filter((b) => now - b.createdAt < lifetime);
        // add a new burst
        const newBurst = {
          id: crypto.randomUUID(),
          createdAt: now,
          x: Math.random(),
          y: Math.random() * 0.7,
          deg: Math.floor(Math.random() * 360),
          shapeSize: 5 + Math.random() * 20,
          spreadDeg: 40 + Math.random() * 60,
          launchSpeed: 1 + Math.random() * 2,
          opacityDeltaMultiplier: 0.8 + Math.random() * 0.5,
        };
        return [...fresh, newBurst];
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header hasClose={false} className='bg-transparent' />
        <Modal.Body className='px-4 pt-2 pb-8'>
          {/* Infinite, optimized confetti pops */}
          {confettiBursts.map((burst) => (
            <Confetti
              key={burst.id}
              mode='boom'
              particleCount={Math.floor(150 + Math.random() * 250)}
              colors={confettiColors}
              x={burst.x}
              y={burst.y}
              deg={burst.deg}
              shapeSize={burst.shapeSize}
              spreadDeg={burst.spreadDeg}
              launchSpeed={burst.launchSpeed}
              opacityDeltaMultiplier={burst.opacityDeltaMultiplier}
            />
          ))}

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
