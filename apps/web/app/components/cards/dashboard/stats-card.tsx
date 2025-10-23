import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

import { StatsCardSkeleton } from './stats-card-skeleton';

import { Card, CardContent } from '~/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  isLoading?: boolean;
  error?: string | null;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  isLoading = false,
  error = null,
}: StatsCardProps) {
  if (isLoading) {
    return <StatsCardSkeleton />;
  }

  if (error) {
    return (
      <Card className='border-destructive/50 rounded-none border'>
        <CardContent className='p-6'>
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
    );
  }

  return (
    <Card className='border-input rounded-none'>
      <CardContent className='p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <p className='text-muted-foreground mb-1 text-sm font-medium'>{title}</p>
            <h3 className='text-foreground mb-2 text-3xl font-bold'>{value}</h3>
            {description && <p className='text-muted-foreground text-sm'>{description}</p>}
            {trend && (
              <div className='mt-2 flex items-center gap-1'>
                <span
                  className={`text-xs font-medium ${
                    trend.positive ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {trend.positive ? '↑' : '↓'} {trend.value}
                </span>
                <span className='text-muted-foreground text-xs'>vs last month</span>
              </div>
            )}
          </div>
          <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
            <Icon className='text-primary h-6 w-6' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
