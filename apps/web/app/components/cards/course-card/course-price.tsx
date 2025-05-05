import { Wallet } from 'lucide-react';

interface CoursePriceProps {
  price: number | null;
}

export function CoursePrice({ price }: CoursePriceProps) {
  const hasPrice = Boolean(price);

  return (
    <div className='flex w-full items-center justify-between pt-4'>
      {hasPrice ? (
        <div className='flex items-baseline space-x-1'>
          <span className='text-xs'>KES</span>
          <span className='text-2xl'>{new Intl.NumberFormat('en-KE').format(price ?? 0)}</span>
          <span className='font-secondary text-muted-foreground text-xs'>/month</span>
        </div>
      ) : (
        <div className='flex items-baseline space-x-1'>
          <span className='flex items-center space-x-1'>
            <Wallet size={12} />
            <span className='pt-1'>Free</span>
          </span>
        </div>
      )}
    </div>
  );
}
