import { NavLink, useLocation } from 'react-router';
import { motion } from 'framer-motion';

import { cn } from '~/lib/utils';

interface Props {
  to: string;
  name: string;
}

export function TabLink({ to, name }: Props) {
  const location = useLocation();

  // Match exact path or any sub-route
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <NavLink
      className={({ isPending }) =>
        cn(
          'group font-secondary relative py-2 hover:cursor-pointer',
          'transition-colors duration-200',
          isActive ? 'text-primary font-bold' : 'text-gray-500',
          isPending ? 'opacity-50' : '',
        )
      }
      to={to}
      end={false}
    >
      <span className='transition-opacity duration-200 group-hover:opacity-80'>{name}</span>

      {isActive && (
        <motion.div
          layoutId='tab-indicator'
          className='bg-primary absolute bottom-0 left-0 h-[4px] w-full'
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </NavLink>
  );
}
