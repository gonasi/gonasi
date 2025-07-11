import { NavLink } from 'react-router';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { useRouteMatch } from '~/hooks/useRouteMatch';
import { cn } from '~/lib/utils';

interface Props {
  icon: LucideIcon;
  to: string;
  name: string;
  end?: boolean;
  forceLabel?: boolean;
}

export function SideLink({ icon: Icon, to, name, end, forceLabel = false }: Props) {
  const isActive = useRouteMatch(to);

  return (
    <NavLink
      to={to}
      end={end}
      className='group font-secondary relative flex w-full items-center'
      aria-disabled={isActive}
    >
      {({ isPending }) => {
        const contentClass = cn(
          'flex w-full items-center space-x-0 md:space-x-4 px-4 py-2 transition-colors duration-200',
          isPending ? 'animate-pulse opacity-55 hover:cursor-wait' : '',
          isActive ? 'text-primary' : 'text-muted-foreground',
        );

        const dotClass = cn(
          'absolute md:hidden top-0 -right-2 h-1 w-1 rounded-full',
          isPending ? 'bg-primary animate-ping' : 'bg-transparent',
        );

        const labelClass = cn(
          'mt-1 transition-opacity duration-200 group-hover:opacity-80',
          forceLabel ? 'flex pl-4 text-xl' : 'hidden md:flex',
        );

        return (
          <>
            <motion.div
              className='from-secondary to-primary absolute right-0 w-1 bg-gradient-to-b'
              initial={false}
              animate={{
                height: isActive ? '100%' : '0%',
              }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              style={{ top: 0 }}
            />

            <div className={contentClass}>
              <div className='relative'>
                <Icon className='h-6 w-6 md:h-4 md:w-4' />
                <span className={dotClass} />
              </div>
              <span className={labelClass}>{name}</span>
            </div>
          </>
        );
      }}
    </NavLink>
  );
}
