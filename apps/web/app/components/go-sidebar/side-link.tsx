import { NavLink, useLocation } from 'react-router';

import { cn } from '~/lib/utils';

interface Props {
  icon: React.ReactNode;
  to: string;
  name: string;
  end?: boolean;
  isActive?: (pathname: string) => boolean;
}

export function SideLink({ icon, to, name, end, isActive }: Props) {
  const location = useLocation();
  const customActive = isActive?.(location.pathname);

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive: defaultIsActive, isPending }) =>
        cn(
          'overflow-hidden text-ellipsis',
          'group flex h-full items-center space-x-0 rounded-md pt-2 hover:cursor-pointer md:space-x-4',
          'font-secondary font-light',
          'hover:bg-primary/5 transition-colors duration-200',
          'border-l-2 border-transparent p-4',
          {
            'bg-primary/5 text-primary border-primary font-bold': customActive ?? defaultIsActive,
            'opacity-50': isPending,
          },
        )
      }
    >
      <div className='flex transition-transform duration-200 group-hover:scale-110 md:hidden lg:flex'>
        {icon}
      </div>
      <span className='hidden text-sm transition-opacity duration-200 group-hover:opacity-80 md:block md:text-sm lg:text-base'>
        {name}
      </span>
    </NavLink>
  );
}
