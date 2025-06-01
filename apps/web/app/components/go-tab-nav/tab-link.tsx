import { NavLink } from 'react-router';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { useRouteMatch } from '~/hooks/useRouteMatch';
import { cn } from '~/lib/utils';

interface Props {
  to: string;
  name: string;
  icon: LucideIcon;
}

export function TabLink({ to, name, icon: Icon }: Props) {
  const isActive = useRouteMatch(to);

  return (
    <NavLink
      className={({ isPending }) =>
        cn(
          'flex w-28 items-center',
          'group font-secondary relative py-2 hover:cursor-pointer',
          'transition-colors duration-200',
          isPending ? 'animate-pulse opacity-55 hover:cursor-wait' : '',
          isActive ? 'text-primary font-bold' : 'text-muted-foreground',
        )
      }
      to={to}
      end={false}
      aria-disabled={isActive}
    >
      <div className='flex w-full items-center justify-center space-x-0 md:space-x-1'>
        <Icon className='h-6 w-6 md:h-4 md:w-4' />
        <span
          className={cn(
            'mt-1 transition-opacity duration-200 group-hover:opacity-80',
            'hidden md:flex',
          )}
        >
          {name}
        </span>
      </div>

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
