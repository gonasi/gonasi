import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import type { PricingSchemaTypes } from '@gonasi/schemas/publish';

import { PricingOptionCard } from './PricingOptionCard';

import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet';
import { cn } from '~/lib/utils';

interface GoPricingSheetProps {
  pricingData: PricingSchemaTypes;
  className?: string;
}

function PricingDisplay({ pricing }: { pricing: PricingSchemaTypes[number] }) {
  if (pricing?.is_free) {
    return <span className='flex items-baseline space-x-1 text-base'>Free</span>;
  }

  return (
    <span className='flex items-baseline space-x-1 text-base'>
      <span className='text-xs font-light'>{pricing?.currency_code}</span>
      <span>{pricing?.price}</span>
      <span className='text-xs font-light italic'>{pricing?.payment_frequency}</span>
    </span>
  );
}

export function GoPricingSheet({ pricingData, className }: GoPricingSheetProps) {
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
        <PricingDisplay pricing={defaultPricing} />
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
            rightIcon={<ChevronRight />}
            rightIconAtEdge
          >
            <PricingDisplay pricing={defaultPricing} />
          </Button>
        </SheetTrigger>
        <SheetContent side='right' className='w-96'>
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
