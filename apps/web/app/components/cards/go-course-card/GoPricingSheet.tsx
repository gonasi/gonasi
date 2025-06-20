import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoveLeft, MoveRight } from 'lucide-react';

import type { PricingSchemaTypes } from '@gonasi/schemas/publish';

import { PricingOptionCard } from './PricingOptionCard';

import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet';
import { cn } from '~/lib/utils';

const bounceTransition = {
  repeat: Infinity,
  duration: 0.8,
  ease: 'easeInOut',
  repeatType: 'reverse' as const,
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

interface GoPricingSheetProps {
  pricingData: PricingSchemaTypes;
  className?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  textSize?: 'sm' | 'lg';
}

function PricingDisplay({
  pricing,
  textSize,
}: {
  pricing: PricingSchemaTypes[number];
  textSize?: 'sm' | 'lg';
}) {
  const isLarge = textSize === 'lg';
  const isSmall = textSize === 'sm';

  const baseStyles = cn(
    'flex items-baseline space-x-1',
    isLarge && 'text-2xl',
    isSmall && 'text-base',
    !textSize && 'text-lg',
  );

  const currencyStyle = cn('font-light', isLarge ? 'text-lg' : isSmall ? 'text-xs' : 'text-sm');

  const frequencyStyle = cn(
    'font-light italic',
    isLarge ? 'text-lg' : isSmall ? 'text-xs' : 'text-sm',
  );

  if (pricing?.is_free) {
    return <span className={baseStyles}>Free</span>;
  }

  return (
    <span className={baseStyles}>
      <span className={currencyStyle}>{pricing?.currency_code}</span>
      <span>{pricing?.price}</span>
      <span className={frequencyStyle}>
        {pricing?.payment_frequency
          ?.split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}
      </span>
    </span>
  );
}

export function GoPricingSheet({
  pricingData,
  className,
  side = 'right',
  textSize = 'sm',
}: GoPricingSheetProps) {
  const [open, setOpen] = useState(false);
  const defaultPricing = pricingData[0];

  if (!defaultPricing) return <p>No pricing</p>;

  if (pricingData.length < 2) {
    return (
      <Button
        type='button'
        variant='ghost'
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={cn('hover:bg-transparent', className)}
      >
        <PricingDisplay pricing={defaultPricing} textSize={textSize} />
      </Button>
    );
  }

  return (
    <button
      type='button'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={cn('border-none bg-transparent p-0', className)}
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
          <Button
            type='button'
            variant='ghost'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            className={cn(className)}
            rightIcon={side === 'right' ? <AnimatedChevronRight /> : undefined}
            leftIcon={side === 'left' ? <AnimatedChevronLeft /> : undefined}
            rightIconAtEdge
          >
            <PricingDisplay pricing={defaultPricing} textSize={textSize} />
          </Button>
        </SheetTrigger>
        <SheetContent side={side} className='w-96'>
          <div className='p-6 md:p-4'>
            <div className='space-y-2'>
              <h4 className='leading-none font-medium'>All Pricing Tiers</h4>
              {pricingData.map((pricingData) => (
                <PricingOptionCard key={pricingData.id} pricingData={pricingData} />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </button>
  );
}
