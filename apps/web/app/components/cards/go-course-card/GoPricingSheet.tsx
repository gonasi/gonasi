import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoveLeft, MoveRight } from 'lucide-react';

import type { PricingSchemaTypes } from '@gonasi/schemas/publish';

import { PricingDisplay } from './PricingDisplay';
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
}

export function GoPricingSheet({ pricingData, className, side = 'right' }: GoPricingSheetProps) {
  const [open, setOpen] = useState(false);
  const defaultPricing = pricingData[0];

  if (!defaultPricing) return <p>No pricing</p>;

  const finalPrice = defaultPricing.promotional_price ?? defaultPricing.price;
  const showOriginalPrice = defaultPricing.promotional_price != null;

  if (pricingData.length < 2) {
    return (
      <Button
        type='button'
        variant='ghost'
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={cn(
          'border-border/50 border pb-4 hover:bg-transparent',
          showOriginalPrice && 'pb-5',
          className,
        )}
      >
        <PricingDisplay
          finalPrice={finalPrice}
          price={defaultPricing.price}
          currency_code={defaultPricing.currency_code}
          payment_frequency={defaultPricing.payment_frequency}
          showOriginalPrice={showOriginalPrice}
          size='sm'
        />
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
            className={cn('border-border/50 border pb-4', showOriginalPrice && 'pb-5', className)}
            rightIcon={side === 'right' ? <AnimatedChevronRight /> : undefined}
            leftIcon={side === 'left' ? <AnimatedChevronLeft /> : undefined}
            rightIconAtEdge
          >
            <PricingDisplay
              finalPrice={finalPrice}
              price={defaultPricing.price}
              currency_code={defaultPricing.currency_code}
              payment_frequency={defaultPricing.payment_frequency}
              showOriginalPrice={showOriginalPrice}
              size='sm'
            />
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
