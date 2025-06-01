import { Skeleton } from '../ui/skeleton';

export function CourseProfileCardSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className='bg-card animate-pulse rounded-lg'>
          <Skeleton className='h-40 w-full rounded-t-lg' />
          <div className='p-4'>
            <Skeleton className='h-10 w-full rounded-none' />
          </div>
        </div>
      ))}
    </div>
  );
}
