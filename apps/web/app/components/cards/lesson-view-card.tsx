import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { CheckCheck, Play } from 'lucide-react';

import { hslToHsla } from '@gonasi/utils/hslToHsla';

import { Badge } from '../ui/badge';
import { LucideIconRenderer } from './lucide-icon-renderer';
import type { LessonTypes } from './types';

interface Props {
  isCompleted: boolean;
  to: string;
  name: string;
  lessonTypes: LessonTypes | null;
  isActiveLesson: boolean;
}

const nudgeAnimation = {
  x: [0, -1, 1, -1, 1, 0],
  scale: [1, 1.005, 1.007, 1.005, 1, 1],
  opacity: [1, 0.995, 0.99, 0.995, 1, 1],
  transition: {
    duration: 1.2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export function LessonViewCard({ isCompleted, to, name, lessonTypes, isActiveLesson }: Props) {
  const borderTopColor = hslToHsla(lessonTypes?.bg_color ?? 'hsl(40 90% 56%)', 20);
  const iconColor = lessonTypes?.bg_color ?? 'hsl(40 90% 56%)';

  return (
    <Link
      to={to}
      className='group bg-card/60 hover:border-card hover:bg-primary/2 my-3 w-full rounded-xl border border-t-4 border-transparent p-4 transition-all duration-300 ease-in-out'
      style={{ borderTopColor }}
    >
      <div className='relative flex items-center gap-3'>
        <LucideIconRenderer
          name={lessonTypes?.lucide_icon}
          size={28}
          strokeWidth={3}
          color={iconColor}
          className='mt-1 shrink-0 rotate-[30deg] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-0'
        />

        <h3 className='group-hover:text-foreground text-base font-medium transition-colors duration-300'>
          {name}
        </h3>

        {isCompleted && (
          <div
            className='text-foreground absolute -top-8 -right-6 rounded-full border-2 p-1'
            style={{
              backgroundColor: hslToHsla(lessonTypes?.bg_color ?? 'hsl(40 90% 56%)', 30),
              borderColor: hslToHsla(lessonTypes?.bg_color ?? 'hsl(40 90% 56%)', 50),
            }}
          >
            <CheckCheck />
          </div>
        )}

        {isActiveLesson && (
          <motion.div
            className='text-foreground absolute -top-8 -right-6 rounded-full border-2 p-1'
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

      <div className='flex justify-end pt-3'>
        <Badge
          variant='outline'
          className='group-hover:border-primary/30 group-hover:text-primary transition-colors duration-300'
        >
          {lessonTypes?.name}
        </Badge>
      </div>
    </Link>
  );
}
