import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

import { StatsCardSkeleton } from './stats-card-skeleton';

import { Card, CardContent } from '~/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  displayUi?: React.ReactNode;
  trendExplanation?: string;
  icon: LucideIcon;
  trend?: {
    value: string; // e.g., "25%"
    difference?: number; // raw number difference (this - last)
    positive: boolean;
  };
  isLoading?: boolean;
  error?: string | null;
}

export function StatsCard({
  title,
  value,
  description,
  displayUi,
  icon: Icon,
  trend,
  trendExplanation,
  isLoading = false,
  error = null,
}: StatsCardProps) {
  if (isLoading) {
    return <StatsCardSkeleton />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Card className='border-destructive/50 min-h-80 rounded-none border'>
          <CardContent className='p-4'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className='text-destructive mb-1 text-sm font-semibold'>Error loading {title}</p>
                <p className='text-muted-foreground text-sm'>{error}</p>
              </div>
              <div className='bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-lg'>
                <AlertTriangle className='text-destructive h-6 w-6' />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className='border-input min-h-80 rounded-none shadow-sm transition-all'>
        <CardContent className='p-4'>
          <div className='flex items-start justify-between'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className='flex-1'
            >
              <p className='text-muted-foreground mb-1 h-10 text-sm leading-5 font-medium'>
                {title}
              </p>
              <motion.h3
                key={value} // animate value change
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className='text-foreground mb-2 text-3xl font-bold'
              >
                {value}
              </motion.h3>

              {displayUi}
              {description && <p className='text-muted-foreground text-sm'>{description}</p>}

              {trend && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className='mt-2 flex items-center gap-1'
                >
                  <span
                    className={`text-xs font-medium ${
                      trend.positive ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {trend.positive ? '↑' : '↓'} {trend.value}
                    {typeof trend.difference === 'number' && (
                      <span className='ml-1'>
                        ({trend.positive ? '+' : '−'}
                        {Math.abs(trend.difference)})
                      </span>
                    )}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    vs last month {trendExplanation}
                  </span>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className='bg-background/20 flex h-12 w-12 items-center justify-center rounded-lg'
            >
              <Icon className='h-6 w-6' />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
