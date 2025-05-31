import { NavLink } from 'react-router';
import { type LucideIcon } from 'lucide-react';

import { cn } from '~/lib/utils';

interface Props {
  icon: LucideIcon;
  to: string;
}

export function BottomNavLink({ icon: Icon, to }: Props) {
  return (
    <NavLink to={to}>
      {({ isActive, isPending }) => {
        const containerClass = cn(
          'flex h-full w-full items-center transition-colors duration-200 hover:cursor-pointer hover:border-muted-foreground/70',
          isActive && 'text-primary font-bold',
          isPending && 'animate-pulse opacity-55 hover:cursor-wait',
        );

        const dotClass = cn(
          'absolute h-1 w-1 rounded-full',
          'top-0 -right-1',
          isPending ? 'bg-primary animate-ping' : 'bg-transparent',
        );

        return (
          <div className={containerClass} aria-disabled={isActive}>
            <div className='relative'>
              <Icon size={28} strokeWidth={isActive ? 2 : 1} />
              <span className={dotClass} />
            </div>
          </div>
        );
      }}
    </NavLink>
  );
}
