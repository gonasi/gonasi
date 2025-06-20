import { motion } from 'framer-motion';

import type { PricingSchemaTypes } from '@gonasi/schemas/publish';

import { Badge } from '~/components/ui/badge';

interface PricingOptionCardProps {
  pricingData: PricingSchemaTypes[number];
  hideDescription?: boolean;
}

export function PricingOptionCard({
  pricingData,
  hideDescription = false,
}: PricingOptionCardProps) {
  const {
    is_popular,
    is_recommended,
    tier_name,
    payment_frequency,
    tier_description,
    promotional_price,
    price,
    currency_code,
  } = pricingData;

  const finalPrice = promotional_price ?? price;
  const showOriginalPrice = promotional_price != null;

  const badgeVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + i * 0.15,
        duration: 0.4,
        ease: 'easeOut',
      },
    }),
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const badges = [
    is_popular && (
      <motion.div
        key='popular'
        custom={0}
        variants={badgeVariants}
        initial='hidden'
        animate='visible'
      >
        <Badge variant='tip'>Popular</Badge>
      </motion.div>
    ),
    is_recommended && (
      <motion.div
        key='recommended'
        custom={1}
        variants={badgeVariants}
        initial='hidden'
        animate='visible'
      >
        <Badge variant='info'>Recommended</Badge>
      </motion.div>
    ),
  ].filter(Boolean);

  return (
    <motion.div variants={cardVariants} initial='hidden' animate='visible' className='pt-3'>
      <div className='relative'>
        {badges.length > 0 && (
          <div className='absolute -top-3 left-3 flex items-center space-x-2'>{badges}</div>
        )}
        <div className='bg-card/10 border/50 rounded-sm border p-3 shadow-md'>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className='flex items-baseline gap-2'
          >
            <div className='text-sm font-medium'>{tier_name || payment_frequency}</div>
          </motion.div>

          {!hideDescription && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className='font-secondary mt-1 text-xs'
            >
              {tier_description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className='flex w-full space-x-3 pt-3'
          >
            <div className='text-foreground flex flex-col items-center text-xl font-semibold'>
              <div>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency_code,
                }).format(finalPrice)}
              </div>
              <div className='text-muted-foreground -mt-1 text-xs'>
                {payment_frequency.replace(/_/g, ' ')}
              </div>
            </div>

            {showOriginalPrice && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className='text-muted-foreground mt-1 flex h-full items-center justify-center line-through'
              >
                {price.toLocaleString()}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
