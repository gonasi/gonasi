import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

export function StatsCardSkeleton() {
  return (
    <Card className='border-input min-h-80 rounded-none'>
      <CardContent className='p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <Skeleton className='mb-1 h-4 w-24' /> {/* title */}
            <Skeleton className='mb-2 h-8 w-32' /> {/* value */}
            <Skeleton className='h-4 w-40' /> {/* description */}
            <div className='mt-3 flex items-center gap-2'>
              <Skeleton className='h-3 w-10' /> {/* trend value */}
              <Skeleton className='h-3 w-16' /> {/* "vs last month" */}
            </div>
          </div>
          <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
            <Skeleton className='h-6 w-6 rounded-md' /> {/* icon placeholder */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
