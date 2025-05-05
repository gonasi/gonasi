import { LoaderCircle } from 'lucide-react';

export function Spinner() {
  return (
    <div className='flex h-full w-full items-center justify-center py-10'>
      <LoaderCircle size={36} className='animate-spin' />
    </div>
  );
}
