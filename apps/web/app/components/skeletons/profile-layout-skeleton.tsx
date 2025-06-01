import { Skeleton } from '~/components/ui/skeleton/skeleton';

export function ProfileLayoutSkeleton() {
  return (
    <div>
      <div className='flex items-center space-x-4'>
        <Skeleton className='h-14 w-14 rounded-full md:h-18 md:w-18' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-[250px]' />
          <Skeleton className='h-4 w-[200px]' />
        </div>
      </div>
      <div className='py-8'>
        <div className='border-b-input flex w-full items-center justify-center gap-8 border-b'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className='h-8 w-full rounded-none md:h-6 md:w-22' key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
