import { NavLink, useLocation } from 'react-router';
import { type LucideIcon } from 'lucide-react';

import { cn } from '~/lib/utils';

interface Props {
  icon: LucideIcon;
  to: string;
}

export function BottomNavLink({ icon: Icon, to }: Props) {
  const location = useLocation();

  // Ensure "Dashboard" is active on `/dashboard` and `/dashboard/`, but not `/dashboard/something`
  const isActive =
    location.pathname === to || (to === '/dashboard' && location.pathname === '/dashboard/');

  return (
    <NavLink
      className={({ isPending }) =>
        cn(
          'flex h-full w-full items-center hover:cursor-pointer',
          'hover:border-muted-foreground/70 transition-colors duration-200',
          `${isActive ? 'text-primary font-bold' : ''}`,
          isPending ? 'animate-pulse opacity-55 hover:cursor-wait' : '',
        )
      }
      to={to}
      aria-disabled={isActive}
    >
      <Icon className='' size={26} strokeWidth={isActive ? 2 : 1} />
    </NavLink>
  );
}
