import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'framer-motion';

import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

interface ICourseToggleProps {
  isPaid: boolean;
}

export function CourseToggle(props: ICourseToggleProps) {
  const navigate = useNavigate();
  const params = useParams();

  const [isPaid, setIsPaid] = useState(props.isPaid);

  const toggleCourseType = () => {
    setIsPaid(!isPaid);
    navigate(
      `/${params.username}/course-builder/${params.courseId}/pricing/type/${isPaid ? 'paid' : 'free'}`,
    );
  };

  return (
    <div>
      <Label>Course type</Label>
      <div className='bg-card/80 flex items-center justify-center space-x-4 rounded-lg p-3'>
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            !isPaid ? 'text-secondary' : 'text-muted-foreground',
          )}
        >
          Free
        </span>

        <motion.button
          className={cn(
            'relative flex h-8 w-14 items-center rounded-full p-1 transition-colors',
            'hover:cursor-pointer',
            'border',
            isPaid ? 'bg-primary/30 border-primary/40' : 'bg-secondary/30 border-secondary/40',
          )}
          onClick={toggleCourseType}
          role='switch'
          aria-checked={isPaid}
          aria-label={`Switch to ${isPaid ? 'free' : 'paid'} course`}
        >
          <motion.div
            className='bg-foreground h-6 w-6 rounded-full shadow-md'
            layout
            transition={{
              type: 'spring',
              stiffness: 700,
              damping: 30,
            }}
            style={{
              x: isPaid ? 24 : 0,
            }}
          />
        </motion.button>

        <span
          className={cn(
            'text-sm font-medium transition-colors',
            isPaid ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          Paid
        </span>
      </div>
    </div>
  );
}
