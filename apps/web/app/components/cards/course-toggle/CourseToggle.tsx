import { useNavigate, useNavigation, useParams } from 'react-router';
import { motion } from 'framer-motion';

import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

interface ICourseToggleProps {
  isPaidState: boolean;
}

export function CourseToggle({ isPaidState }: ICourseToggleProps) {
  const navigate = useNavigate();
  const params = useParams();
  const navigation = useNavigation();

  const isNavigating = navigation.state !== 'idle';

  const toggleCourseType = () => {
    if (!isNavigating) {
      navigate(
        `/${params.username}/course-builder/${params.courseId}/pricing/switch-from/${isPaidState ? 'paid' : 'free'}`,
      );
    }
  };

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

        <motion.button
          className={cn(
            'relative flex h-8 w-14 items-center rounded-full p-1 transition-colors',
            'border',
            'hover:cursor-pointer',
            isPaidState ? 'bg-primary/30 border-primary/40' : 'bg-secondary/30 border-secondary/40',
            isNavigating && 'animate-pulse cursor-not-allowed opacity-50',
          )}
          onClick={toggleCourseType}
          role='switch'
          aria-checked={isPaidState}
          aria-label={`Switch to ${isPaidState ? 'free' : 'paid'} course`}
          disabled={isNavigating}
        >
          <motion.div
            className={cn(
              'bg-foreground h-6 w-6 rounded-full shadow-md',
              isNavigating && 'animate-pulse',
            )}
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
        </motion.button>

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
