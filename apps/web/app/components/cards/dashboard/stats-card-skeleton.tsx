import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

export function StatsCardSkeleton() {
  return (
    <Card className='border-input min-h-80 rounded-none'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <Skeleton className='mb-6 h-4 w-32' /> {/* title */}
            <Skeleton className='mb-4 h-8 w-8' /> {/* value */}
            <Skeleton className='h-18 w-48' /> {/* description */}
            <div className='mt-3 flex items-center gap-2'>
              <Skeleton className='h-3 w-10' /> {/* trend value */}
              <Skeleton className='h-3 w-16' /> {/* "vs last month" */}
            </div>
          </div>
          <div className='bg-background/20 flex h-12 w-12 items-center justify-center rounded-lg'>
            <Skeleton className='h-6 w-6 rounded-md' /> {/* icon placeholder */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
