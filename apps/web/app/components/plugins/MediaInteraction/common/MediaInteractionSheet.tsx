import { useState } from 'react';
import { motion, type Transition } from 'framer-motion';
import { Menu, MoveLeft, MoveRight } from 'lucide-react';

import { IconTooltipButton } from '~/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet';
import { cn } from '~/lib/utils';

const bounceTransition: Transition = {
  repeat: Infinity,
  duration: 0.6,
  ease: 'easeInOut' as const, // or array / function
  repeatType: 'reverse',
};

export function AnimatedChevronRight() {
  return (
    <motion.div animate={{ x: [0, 4] }} transition={bounceTransition}>
      <MoveRight />
    </motion.div>
  );
}

export function AnimatedChevronLeft() {
  return (
    <motion.div animate={{ x: [0, -4] }} transition={bounceTransition}>
      <MoveLeft />
    </motion.div>
  );
}
interface MediaInteractionSheetProps {
  title: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  children: React.ReactNode;
}

export function MediaInteractionSheet({
  title,
  side = 'right',
  children,
}: MediaInteractionSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      role='presentation'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        // Prevent default for common keys like Enter or Space
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className={cn('flex w-full items-start border-none bg-transparent p-0')}
    >
      <Sheet
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            setTimeout(() => setOpen(false), 0);
          } else {
            setOpen(newOpen);
          }
        }}
      >
        <SheetTrigger asChild>
          <IconTooltipButton
            variant='default'
            type='button'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            title={title}
            icon={Menu}
          />
        </SheetTrigger>
        <SheetContent
          side={side}
          className='max-h-screen w-full overflow-y-auto pb-10 sm:w-[28rem]'
          title='Pricing Tiers'
        >
          <div className='p-4'>
            <div className='space-y-2'>
              <h4 className='py-2 text-lg leading-none'>{title}</h4>
              <div>{children}</div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
