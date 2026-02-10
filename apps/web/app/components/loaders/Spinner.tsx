import { LoaderCircle } from 'lucide-react';

interface SpinnerProps {
  size?: number; // optional, defaults to 36
}

export function Spinner({ size = 36 }: SpinnerProps) {
  return (
    <div className='flex h-full w-full items-center justify-center py-10'>
      <LoaderCircle size={size} className='animate-spin' />
    </div>
  );
}
