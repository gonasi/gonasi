import { motion } from 'framer-motion';

export type PaymentFrequency = 'monthly' | 'bi_monthly' | 'quarterly' | 'semi_annual' | 'annual';

interface PricingDisplayProps {
  finalPrice: number;
  price: number;
  currency_code: string;
  payment_frequency: PaymentFrequency;
  showOriginalPrice?: boolean;
  size?: 'sm' | 'md';
}

export const frequencyLabels: Record<PaymentFrequency, string> = {
  monthly: 'month',
  bi_monthly: '2 months',
  quarterly: 'quarter',
  semi_annual: '6 months',
  annual: 'year',
};

export function PricingDisplay({
  finalPrice,
  price,
  currency_code,
  payment_frequency,
  showOriginalPrice = false,
  size = 'md',
}: PricingDisplayProps) {
  const isSmall = size === 'sm';

  if (finalPrice === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className={`flex w-full flex-col ${isSmall ? 'pt-2' : 'pt-3'}`}
      >
        <div className={`text-foreground font-semibold ${isSmall ? 'text-base' : 'text-xl'}`}>
          Free
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className={`flex w-full flex-col space-x-3 ${isSmall ? 'pt-2' : 'pt-3'}`}
    >
      {showOriginalPrice && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className={`text-muted-foreground mt-1 flex h-full items-center justify-start line-through ${
            isSmall ? 'text-sm' : 'text-md'
          }`}
        >
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency_code,
          }).format(price)}
        </motion.div>
      )}
      <div
        className={`text-foreground relative flex items-baseline space-x-0.5 font-semibold ${
          isSmall ? 'text-base' : 'text-xl'
        }`}
      >
        <div>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency_code,
          }).format(finalPrice)}
        </div>
        <div className='text-muted-foreground text-xs'>/</div>
        <div className={`text-muted-foreground -mt-1 ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
          {frequencyLabels[payment_frequency]}
        </div>
      </div>
    </motion.div>
  );
}
