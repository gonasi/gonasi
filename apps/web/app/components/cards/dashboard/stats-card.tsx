import type { LucideIcon } from 'lucide-react';

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
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className='transition-smooth border-input'>
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
