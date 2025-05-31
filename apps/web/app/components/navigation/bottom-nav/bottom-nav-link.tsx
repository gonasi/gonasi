import { NavLink } from 'react-router';
import { type LucideIcon } from 'lucide-react';

import { cn } from '~/lib/utils';

interface Props {
  icon: LucideIcon;
  to: string;
  name: string;
}

export function BottomNavLink({ icon: Icon, to, name }: Props) {
  return (
    <NavLink to={to}>
      {({ isActive, isPending }) => {
        const containerClass = cn(
          'flex h-full w-full items-center transition-colors duration-200 hover:cursor-pointer hover:border-muted-foreground/70',
          isActive && 'text-primary font-bold',
          isPending && 'animate-pulse opacity-55 hover:cursor-wait',
        );

        const dotClass = cn(
          'h-1 w-1 rounded-full',
          isPending ? 'bg-primary animate-ping' : 'bg-transparent',
        );

        return (
          <div className={containerClass} aria-disabled={isActive}>
            <div className='flex flex-col items-center gap-1'>
              <Icon size={24} strokeWidth={isActive ? 2 : 1} />
              <div className='flex gap-1'>
                <span className='ml-1 text-xs'>{name}</span>
                <span className={dotClass} />
              </div>
            </div>
          </div>
        );
      }}
    </NavLink>
  );
}
