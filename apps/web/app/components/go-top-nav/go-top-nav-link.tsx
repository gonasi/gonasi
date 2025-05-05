import { NavLink, useLocation } from 'react-router';

import { cn } from '~/lib/utils';

interface Props {
  icon: React.ReactNode;
  to: string;
  name: string;
}

export function GoTopNavLink({ icon, to, name }: Props) {
  const location = useLocation();

  // Ensure "Dashboard" is active on `/dashboard` and `/dashboard/`, but not `/dashboard/something`
  const isActive =
    location.pathname === to || (to === '/dashboard' && location.pathname === '/dashboard/');

  return (
    <NavLink
      className={({ isPending }) =>
        cn(
          'group text-muted-foreground flex h-full items-center space-x-2 hover:cursor-pointer',
          'border-b-2 border-b-transparent',
          'hover:border-muted-foreground/70 transition-colors duration-200',
          `${isActive ? 'hover:border-primary border-b-primary text-primary font-bold' : ''}`,
          isPending ? 'opacity-50' : '',
        )
      }
      to={to}
    >
      {icon}
      <span className='text-sm transition-opacity duration-200 group-hover:opacity-80 md:text-base'>
        {name}
      </span>
    </NavLink>
  );
}
