import { NavLink, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { cn } from '~/lib/utils';

interface Props {
  to: string;
  name: string;
  icon: LucideIcon;
}

export function TabLink({ to, name, icon: Icon }: Props) {
  const location = useLocation();

  // Match exact path or any sub-route
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <NavLink
      className={({ isPending }) =>
        cn(
          'flex items-center',
          'group font-secondary relative py-2 hover:cursor-pointer',
          'transition-colors duration-200',
          isActive ? 'text-primary' : 'text-muted-foreground',
          isPending ? 'opacity-50' : '',
        )
      }
      to={to}
      end={false}
    >
      <div className='flex w-full items-center justify-center space-x-0 md:space-x-1'>
        <Icon size={16} />
        <span
          className={cn('transition-opacity duration-200 group-hover:opacity-80', 'hidden md:flex')}
        >
          {name}
        </span>
      </div>

      {/* Animated gradient underline */}
      <motion.div
        className={cn(
          'from-secondary to-primary via-primary absolute bottom-0 left-0 h-0.5 bg-gradient-to-l',
          'hidden md:flex',
        )}
        initial={false}
        animate={{ width: isActive ? '100%' : '0%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
    </NavLink>
  );
}
