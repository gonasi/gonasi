import { type PropsWithChildren, Suspense } from 'react';
import { Await } from 'react-router';
import { motion } from 'framer-motion';
import { Ban, LoaderCircle, RotateCcw, Vibrate, Volume2, VolumeX } from 'lucide-react';

import { Container } from '../container';

import { ActionDropdown } from '~/components/action-dropdown';
import { BackArrowNavLink } from '~/components/ui/button';
import { Progress, SegmentedProgress } from '~/components/ui/progress';
import { cn } from '~/lib/utils';
import type { LessonNavigationPromise } from '~/routes/publishedCourses/lesson-play/lesson-play-index';
import { useStore } from '~/store';

interface Props extends PropsWithChildren {
  to: string;
  basePath: string;
  progress: number;
  segments: { id: string; weight: number; is_complete: boolean }[];
  loading: boolean;
  activeBlockId?: string;
  lessonNavigationPromise: LessonNavigationPromise;
}

export function CoursePlayLayout({
  children,
  to,
  basePath,
  progress,
  loading,
  segments,
  activeBlockId,
  lessonNavigationPromise,
}: Props) {
  const { isSoundEnabled, isVibrationEnabled, toggleSound, toggleVibration } = useStore();

  const items = [
    {
      title: 'Restart lesson',
      icon: RotateCcw,
      to: `${basePath}/restart`,
      disabled: progress === 0,
    },
    {
      title: isSoundEnabled ? 'Disable sound' : 'Enable sound',
      icon: isSoundEnabled ? Volume2 : VolumeX,
      onClick: toggleSound,
    },
    {
      title: isVibrationEnabled ? 'Disable vibration' : 'Enable vibration',
      icon: isVibrationEnabled ? Vibrate : Ban,
      onClick: toggleVibration,
    },
  ];

  return (
    <div className={cn('bg-background/80', progress === 100 ? 'pb-20' : 'pb-[80vh]')}>
      <div className='bg-background/80 sticky top-0 z-50 shadow-sm backdrop-blur'>
        <Container className='flex items-center justify-between space-x-4 py-4 md:space-x-8 md:py-6'>
          <BackArrowNavLink to={to} />

          <SegmentedProgress segments={segments} activeBlockId={activeBlockId} />

          <div>
            {loading ? (
              <LoaderCircle className='animate-spin cursor-not-allowed' aria-disabled />
            ) : (
              <ActionDropdown items={items} />
            )}
          </div>
        </Container>
        <Suspense
          fallback={
            <div className='bg-secondary/20 relative h-0.5'>
              <div
                className={cn(
                  'from-secondary/70 to-primary/70 absolute top-0 left-0 h-full bg-gradient-to-r',
                )}
              />
            </div>
          }
        >
          <Await
            resolve={lessonNavigationPromise}
            errorElement={
              <div className='bg-secondary/20 relative h-0.5 overflow-hidden rounded'>
                <motion.div
                  className='from-secondary/70 to-primary/70 absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r'
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            }
          >
            {(navigationData) => {
              if (!navigationData) return null;
              return (
                <Progress
                  className='h-0.5'
                  value={navigationData.completion.blocks.percentage}
                  bgClassName='from-secondary/70 to-primary/70 bg-gradient-to-r'
                />
              );
            }}
          </Await>
        </Suspense>
      </div>
      <div>{children}</div>
    </div>
  );
}
