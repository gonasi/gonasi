import { Skeleton } from '~/components/ui/skeleton/skeleton';

export function ProfileLayoutSkeleton() {
  return (
    <div className='flex items-center space-x-4'>
      <Skeleton className='h-14 w-14 rounded-full' />
      <div className='space-y-2'>
        <Skeleton className='h-4 w-[250px]' />
        <Skeleton className='h-4 w-[200px]' />
      </div>
    </div>
  );
}
