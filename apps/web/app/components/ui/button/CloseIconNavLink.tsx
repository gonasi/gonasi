import { NavLink } from 'react-router';
import { X } from 'lucide-react';

import { cn } from '~/lib/utils';

interface CloseIconNavLinkProps {
  to: string;
  size?: number;
}

export function CloseIconNavLink({ to, size = 22 }: CloseIconNavLinkProps) {
  return (
    <NavLink to={to}>
      {({ isPending }) => (
        <div className={cn('relative hover:cursor-pointer', isPending && 'cursor-wait')}>
          <X size={size} className={cn(isPending && 'animate-pulse cursor-wait')} />
          {isPending ? (
            <span className='bg-primary absolute top-0 right-0 h-0.5 w-0.5 animate-ping rounded-full' />
          ) : null}
        </div>
      )}
    </NavLink>
  );
}
