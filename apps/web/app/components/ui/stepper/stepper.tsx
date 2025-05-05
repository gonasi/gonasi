import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheckBig, CircleDot } from 'lucide-react';

import { Progress } from '../progress';

import { cn } from '~/lib/utils';

export interface Step {
  id: string;
  title: string;
  path: string;
}

interface StepperProps {
  steps: Step[];
  className?: string;
  currentStepIndex: number;
}

export function Stepper({ steps, className, currentStepIndex }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className='flex items-center justify-between pb-4 text-sm'>
        {steps.map((step, index) => (
          <div key={step.id} className='flex w-full flex-col items-center'>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2',
                index <= currentStepIndex
                  ? 'bg-secondary border-secondary text-success-foreground'
                  : 'border-muted-foreground text-muted-foreground',
              )}
            >
              <AnimatePresence mode='popLayout'>
                {index < currentStepIndex ? (
                  // Completed Step (Check Icon)
                  <motion.div
                    key='check'
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <CircleCheckBig className='h-5 w-5' />
                  </motion.div>
                ) : index === currentStepIndex ? (
                  // Current Step (Pulsing Dot)
                  <motion.div
                    key='dot'
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: 1,
                      scale: [1, 1.2, 1],
                      transition: {
                        repeat: Infinity,
                        repeatType: 'loop',
                        duration: 1.2,
                        ease: 'easeInOut',
                      },
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <CircleDot className='h-5 w-5' />
                  </motion.div>
                ) : (
                  // Future Step (Number)
                  <span key='number' className='text-sm font-medium'>
                    {index + 1}
                  </span>
                )}
              </AnimatePresence>
            </div>
            <span
              className={cn(
                'mt-2 hidden text-center text-xs font-medium md:block',
                index <= currentStepIndex ? 'text-secondary' : 'text-muted-foreground',
              )}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
      <Progress value={((currentStepIndex + 1) / steps.length) * 100} className='h-2' />
    </div>
  );
}
