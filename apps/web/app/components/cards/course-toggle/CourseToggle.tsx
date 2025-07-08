import { NavLink, useParams } from 'react-router';
import { motion } from 'framer-motion';

import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

interface ICourseToggleProps {
  isPaidState: boolean;
}

const MotionNavLink = motion(NavLink);

export function CourseToggle({ isPaidState }: ICourseToggleProps) {
  const params = useParams();

  const targetPath = `/${params.organizationId}/builder/${params.courseId}/pricing/update-pricing-type`;

  return (
    <div>
      <Label>Course type</Label>
      <div className='bg-card/80 flex items-center justify-center space-x-4 rounded-lg px-3 py-2'>
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            !isPaidState ? 'text-secondary' : 'text-muted-foreground',
          )}
        >
          Free
        </span>

        <MotionNavLink
          to={targetPath}
          className={({ isPending }) =>
            cn(
              'relative flex h-8 w-14 items-center rounded-full p-1 transition-colors',
              'border',
              'hover:cursor-pointer',
              isPaidState
                ? 'bg-primary/30 border-primary/40'
                : 'bg-secondary/30 border-secondary/40',
              isPending && 'animate-pulse cursor-not-allowed',
            )
          }
          role='switch'
          aria-checked={isPaidState}
          aria-label={`Switch to ${isPaidState ? 'free' : 'paid'} course`}
        >
          <motion.div
            className={cn('bg-foreground h-6 w-6 rounded-full shadow-md')}
            layout
            transition={{
              type: 'spring',
              stiffness: 700,
              damping: 30,
            }}
            style={{
              x: isPaidState ? 24 : 0,
            }}
          />
        </MotionNavLink>

        <span
          className={cn(
            'text-sm font-medium transition-colors',
            isPaidState ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          Paid
        </span>
      </div>
    </div>
  );
}
