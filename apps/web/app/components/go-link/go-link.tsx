import { Link, type LinkProps } from 'react-router';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~/lib/utils';

const linkVariants = cva(
  'inline-flex items-center gap-1 text-sm font-medium transition-colors hover:underline font-primary',
  {
    variants: {
      variant: {
        default: 'text-secondary hover:text-secondary-hover',
        primary: 'text-primary hover:text-primary-hover',
        success: 'text-success hover:text-success-hover',
        warning: 'text-warning hover:text-warning-hover',
        danger: 'text-danger hover:text-danger-hover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface GoLinkProps extends LinkProps, VariantProps<typeof linkVariants> {
  className?: string;
}

export function GoLink({ className, variant, to, ...props }: GoLinkProps) {
  return <Link to={to} className={cn(linkVariants({ variant }), className)} {...props} />;
}
