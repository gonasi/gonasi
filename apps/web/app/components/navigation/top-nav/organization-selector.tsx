import { type ReactNode } from 'react';
import { NavLink, type NavLinkProps } from 'react-router';
import { motion } from 'framer-motion';
import { ChevronsUpDown, Loader2 } from 'lucide-react';

import { cn } from '~/lib/utils';

interface OrgButtonProps {
  organizationLabel?: ReactNode | string;
  to: NavLinkProps['to'];
  className?: string;
}

export function OrganizationSelectorButton({
  organizationLabel = 'Create or join an organization',
  to,
  className,
}: OrgButtonProps) {
  const isStringLabel = typeof organizationLabel === 'string';
  const label = organizationLabel;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 250, damping: 18 }}
    >
      <NavLink to={to}>
        {({ isPending }) => (
          <span
            className={cn(
              'max-w-56 rounded-full border-2 border-dashed bg-transparent px-2 py-2 text-sm font-medium md:max-w-72',
              'border-muted-foreground/40 hover:border-primary/20 hover:cursor-pointer',
              'flex items-center justify-between gap-2 overflow-hidden transition-colors duration-200',
              !isPending && 'pointer-events-none cursor-not-allowed opacity-60',
              className,
            )}
          >
            <span className={cn('flex-1 text-left', isStringLabel && 'truncate')}>{label}</span>
            {isPending ? (
              <Loader2 className='h-4 w-4 animate-spin opacity-70' />
            ) : (
              <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100' />
            )}
          </span>
        )}
      </NavLink>
    </motion.div>
  );
}
