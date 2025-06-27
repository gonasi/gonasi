import { NavLink } from 'react-router';
import type { LucideIcon } from 'lucide-react';

import { cn } from '~/lib/utils';

interface IconNavLinkProps {
  to: string;
  icon: LucideIcon;
  size?: number;
  className?: string;
}

export function IconNavLink({ to, icon: Icon, size = 22, className }: IconNavLinkProps) {
  return (
    <NavLink to={to}>
      {({ isPending }) => (
        <div className={cn('relative hover:cursor-pointer', className)}>
          <Icon size={size} className={cn(isPending && 'animate-pulse')} />
          {isPending ? (
            <span className='bg-primary absolute top-0 right-0 h-0.5 w-0.5 animate-ping rounded-full' />
          ) : null}
        </div>
      )}
    </NavLink>
  );
}
