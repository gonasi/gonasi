import { NavLink } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import { cn } from '~/lib/utils';

interface BackArrowNavLinkProps {
  to: string;
  size?: number;
  className?: string;
}

export function BackArrowNavLink({ to, size = 22, className }: BackArrowNavLinkProps) {
  return (
    <NavLink to={to}>
      {({ isPending }) => (
        <div className={cn('relative hover:cursor-pointer', className)}>
          <ArrowLeft size={size} className={cn(isPending && 'animate-pulse')} />
          {isPending ? (
            <span className='bg-primary absolute top-0 right-0 h-0.5 w-0.5 animate-ping rounded-full' />
          ) : null}
        </div>
      )}
    </NavLink>
  );
}
