import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

interface TransactionTypeBadgeProps {
  type: string;
}

const typeConfig: Record<string, { label: string; className: string }> = {
  payment_inflow: {
    label: 'Payment In',
    className: 'bg-success/10 text-success hover:bg-success/20 border-success/20',
  },
  course_purchase: {
    label: 'Course Purchase',
    className: 'bg-success/10 text-success hover:bg-success/20 border-success/20',
  },
  payment_gateway_fee: {
    label: 'Gateway Fee',
    className: 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20',
  },
  platform_revenue: {
    label: 'Platform Revenue',
    className: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20',
  },
  org_payout: {
    label: 'Org Payout',
    className: 'bg-accent/10 text-accent hover:bg-accent/20 border-accent/20',
  },
};

export const TransactionTypeBadge = ({ type }: TransactionTypeBadgeProps) => {
  const config = typeConfig[type] || {
    label: type.replace(/_/g, ' '),
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge variant='outline' className={cn('font-medium capitalize', config.className)}>
      {config.label}
    </Badge>
  );
};
