import { cn } from '~/lib/utils';

interface GoogleIconProps {
  className?: string;
}

export function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <div>
      <img src='/assets/images/google.png' alt='Google' className={cn('h-4 w-4', className)} />
    </div>
  );
}
