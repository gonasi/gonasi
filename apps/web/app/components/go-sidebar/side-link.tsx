import { NavLink } from 'react-router';

import { cn } from '~/lib/utils';

interface Props {
  icon: React.ReactNode;
  to: string;
  name: string;
}

export function SideLink({ icon, to, name }: Props) {
  return (
    <NavLink
      className={({ isActive, isPending }) =>
        cn(
          'overflow-hidden text-ellipsis',
          'group flex h-full items-center space-x-0 rounded-md pt-2 hover:cursor-pointer md:space-x-4',
          'font-secondary font-light',
          'hover:bg-primary/5 transition-colors duration-200',
          `border-l-4 border-transparent p-4 ${isActive ? 'bg-primary/5 text-primary font-bold' : ''}`,
          isPending ? 'opacity-50' : '',
        )
      }
      to={to}
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
