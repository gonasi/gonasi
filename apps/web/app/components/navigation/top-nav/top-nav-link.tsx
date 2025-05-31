import { NavLink, useLocation } from 'react-router';
import { motion } from 'framer-motion';

import { cn } from '~/lib/utils';

interface Props {
  icon: React.ReactNode;
  to: string;
  name: string;
}

export function TopNavLink({ icon, to, name }: Props) {
  const location = useLocation();

  const isActive =
    location.pathname === to || (to === '/dashboard' && location.pathname === '/dashboard/');

  return (
    <NavLink
      className={({ isPending }) =>
        cn(
          'group text-muted-foreground relative flex h-full items-center space-x-2 px-2',
          'transition-colors duration-200 hover:cursor-pointer',
          isPending ? 'animate-pulse opacity-55 hover:cursor-wait' : '',
          isActive ? 'text-primary font-bold' : '',
        )
      }
      to={to}
      aria-disabled={isActive}
    >
      {icon}
      <span className='mt-2 transition-opacity duration-200 group-hover:opacity-80'>{name}</span>

      {/* Smooth slide-in bottom border */}
      <motion.div
        className='from-secondary to-primary absolute bottom-0 left-0 h-0.5 bg-gradient-to-r'
        initial={false}
        animate={{ width: isActive ? '100%' : '0%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
    </NavLink>
  );
}
