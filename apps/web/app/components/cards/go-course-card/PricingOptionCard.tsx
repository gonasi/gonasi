import { motion } from 'framer-motion';
import { MoveRight } from 'lucide-react';

import type { PricingSchemaTypes } from '@gonasi/schemas/publish/course-pricing';

import { PricingDisplay } from './PricingDisplay';

import { Badge } from '~/components/ui/badge';
import { NavLinkButton } from '~/components/ui/button';

interface PricingOptionCardProps {
  pricingData: PricingSchemaTypes[number];
  hideDescription?: boolean;
  hideContinueButton?: boolean;
}

export function PricingOptionCard({
  pricingData,
  hideDescription = false,
  hideContinueButton = false,
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
        <div className='bg-card/20 border/50 rounded-sm border p-3 shadow-none'>
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

          <div className='flex items-center justify-between'>
            <PricingDisplay
              finalPrice={finalPrice}
              price={price}
              currency_code={currency_code}
              payment_frequency={payment_frequency}
              showOriginalPrice={showOriginalPrice}
            />
            {!hideContinueButton && (
              <div>
                <NavLinkButton
                  to={`/c/${pricingData.course_id}/enroll/${pricingData.id}`}
                  size='sm'
                  variant='secondary'
                  rightIcon={<MoveRight />}
                >
                  Continue
                </NavLinkButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
