import { type ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';

import GoParsedContent from './GoParsedContent';

import { cn } from '~/lib/utils';

export type ListOfErrors = (string | null | undefined)[] | null | undefined;

export const hasErrors = (listOfErrors: ListOfErrors) => {
  return Array.isArray(listOfErrors) && listOfErrors.some((error) => error);
};

export function ErrorDisplay({ error }: { error?: string }) {
  return (
    <AnimatePresence mode='wait'>
      {error && (
        <motion.div
          key='error'
          initial={{ opacity: 0, y: 4 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 20 },
          }}
          exit={{ opacity: 0, y: 4 }}
          className='text-danger font-secondary flex items-start gap-2 pl-4 text-xs font-thin'
        >
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <GoParsedContent html={error} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ErrorList({ id, errors }: { errors?: ListOfErrors; id?: string }) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul id={id} className='flex flex-col gap-1 px-3'>
      {errorsToRender.map((e) => (
        <li key={e} className='font-secondary text-danger text-xs'>
          {e}
        </li>
      ))}
    </ul>
  );
}

export function FormDescription({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <motion.p
      id={id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('text-muted-foreground flex items-start pt-1 text-[0.8rem]')}
    >
      <Info className='h-6 w-6 flex-shrink-0 pr-2' />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className='pt-1'
      >
        {children}
      </motion.span>
    </motion.p>
  );
}

interface SliderDisplayProps {
  sliderValue: number[]; // assuming range or single value in array
  returnSingleValue: boolean;
}

export function SliderDisplay({ sliderValue, returnSingleValue }: SliderDisplayProps) {
  const currentValue = returnSingleValue
    ? String(sliderValue[0])
    : sliderValue.map(String).join(', ');

  const prevValueRef = useRef(currentValue);
  const [displayValue, setDisplayValue] = useState(currentValue);
  const [isIncreasing, setIsIncreasing] = useState(true);

  useEffect(() => {
    const numericPrev = parseFirst(prevValueRef.current);
    const numericCurr = parseFirst(currentValue);

    if (numericCurr !== numericPrev) {
      setIsIncreasing(numericCurr > numericPrev);
      setDisplayValue(currentValue);
    }
  }, [currentValue]);

  const handleAnimationComplete = () => {
    prevValueRef.current = currentValue;
  };

  const parseFirst = (val: string): number => {
    const first = val.split(',')[0];
    return parseFloat(first || '0');
  };

  return (
    <div className='font-primary flex items-center space-x-1 text-xs'>
      <span className='bg-card/80 inline-block min-w-[32px] rounded-sm p-1 text-center'>
        <div className='relative h-4 overflow-hidden'>
          {/* height ~ line height of text-xs */}
          <AnimatePresence mode='wait'>
            <motion.span
              key={displayValue}
              initial={{ y: isIncreasing ? 16 : -16, opacity: 0, position: 'absolute' }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: isIncreasing ? -16 : 16, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onAnimationComplete={handleAnimationComplete}
              className='absolute right-0 left-0'
            >
              {displayValue}
            </motion.span>
          </AnimatePresence>
        </div>
      </span>
    </div>
  );
}
