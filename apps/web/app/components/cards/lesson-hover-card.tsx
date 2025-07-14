import { NavLink } from 'react-router';
import { motion } from 'framer-motion';
import { CheckCheck, Play } from 'lucide-react';

import { hslToHsla } from '@gonasi/utils/hslToHsla';

import { Badge } from '../ui/badge';
import { LucideIconRenderer } from './lucide-icon-renderer';
import type { LessonTypes } from './types';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card';
import { cn } from '~/lib/utils';

interface Props {
  isCompleted: boolean;
  to: string;
  name: string;
  lessonTypes: LessonTypes | null;
  isActiveLesson: boolean;
  userHasAccess: boolean;
}

const nudgeAnimation = {
  x: [0, -2, 2, -2, 2, 0],
  scale: [1, 1.01, 1.015, 1.01, 1, 1],
  opacity: [1, 0.98, 0.96, 0.98, 1, 1],
  transition: {
    duration: 1.2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export function LessonHoverCard({
  isCompleted,
  to,
  name,
  lessonTypes,
  isActiveLesson,
  userHasAccess,
}: Props) {
  const statusText = !userHasAccess
    ? '🔒 Locked'
    : isCompleted
      ? '🎓 Completed'
      : isActiveLesson
        ? '📘 Next Lesson'
        : '🕓 Not Started';

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className='group flex flex-col items-center transition-all duration-300 ease-in-out hover:scale-[1.02]'>
          <NavLink to={to}>
            {({ isPending }) => (
              <div
                className={cn(
                  'relative flex h-16 w-16 items-center justify-center rounded-full',
                  'border-t-1 border-b-6 border-l-2',
                  'text-foreground',
                  'shadow-lg',
                  'rotate-[30deg]',
                  'transition-transform duration-300 ease-in-out group-hover:-rotate-[0deg]',
                  { 'animate-pulse': isPending },
                )}
                style={{
                  backgroundColor: hslToHsla(
                    lessonTypes?.bg_color ?? 'hsl(40 90% 56%)',
                    isCompleted ? 20 : 80,
                  ),
                  borderColor: hslToHsla(
                    lessonTypes?.bg_color ?? 'hsl(40 90% 56%)',
                    isCompleted ? 40 : 99,
                  ),
                }}
              >
                <LucideIconRenderer name={lessonTypes?.lucide_icon} size={28} strokeWidth={3} />

                {isCompleted && (
                  <div
                    className='text-success-foreground absolute -top-2 right-2 flex h-6 w-6 -rotate-[30deg] items-center justify-center rounded-full p-0.5 text-xs font-bold shadow-md'
                    style={{
                      backgroundColor: hslToHsla(lessonTypes?.bg_color ?? 'hsl(40 90% 56%)', 95),
                      borderColor: lessonTypes?.bg_color,
                    }}
                  >
                    <CheckCheck strokeWidth={3} />
                  </div>
                )}

                {isActiveLesson && (
                  <motion.div
                    className={cn(
                      'text-success-foreground',
                      'absolute -top-2 right-2',
                      'flex h-6 w-6 items-center justify-center',
                      '-rotate-[30deg] rounded-full border p-0.5',
                      'text-xs font-bold shadow-md',
                    )}
                    style={{
                      backgroundColor: hslToHsla(lessonTypes?.bg_color ?? 'hsl(40 90% 56%)', 85),
                      borderColor: lessonTypes?.bg_color,
                    }}
                    animate={nudgeAnimation}
                  >
                    <Play strokeWidth={3} />
                  </motion.div>
                )}
              </div>
            )}
          </NavLink>
          <p className='text-foreground/60 group-hover:text-foreground/80 w-30 truncate text-sm transition-colors duration-300'>
            {name}
          </p>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className='w-80'>
        <div className='flex w-full justify-between space-x-4'>
          <div className='flex w-full items-center pt-2'>
            <div className='flex w-full flex-col space-y-2'>
              <span className='text-md text-foreground/90'>{name}</span>
              <div className='flex w-full justify-between'>
                <Badge variant='outline'>{lessonTypes?.name}</Badge>
                <Badge variant='outline'>{statusText}</Badge>
              </div>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
