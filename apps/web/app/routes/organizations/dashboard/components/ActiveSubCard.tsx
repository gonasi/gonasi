import { Ban, Zap } from 'lucide-react';

import type {
  OrganizationSubscription,
  OrganizationTier,
} from '@gonasi/database/organizationSubscriptions';

import { NavLinkButton } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';

interface ActiveSubCardProps {
  subscription: OrganizationSubscription;
  tier: OrganizationTier;
}

export function ActiveSubCard({ subscription, tier }: ActiveSubCardProps) {
  const isActive = subscription.status === 'active';
  const isCanceled = subscription.cancel_at_period_end;

  const isFreePlan = tier.price_monthly_usd === 0;

  const startDate = new Date(subscription.start_date).toLocaleDateString();

  const nextBillingDate = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : 'N/A';

  const monthlyPrice = tier.price_monthly_usd;
  const currency = tier.plan_currency?.toUpperCase() || 'USD';

  const displayTier = subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1);

  return (
    <Card className='border-border/50 rounded-none'>
      <CardContent className='p-4'>
        <div className='mb-4 flex items-start justify-between'>
          <div>
            <div className='mb-2 flex items-center gap-2'>
              <h2 className='text-2xl font-bold'>{displayTier} Plan</h2>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive && !isCanceled
                    ? 'bg-green-500/20 text-green-600'
                    : isCanceled
                      ? 'bg-yellow-500/20 text-yellow-600'
                      : 'bg-destructive/20 text-destructive'
                }`}
              >
                {isActive && !isCanceled ? 'Active' : isCanceled ? 'Canceling' : 'Inactive'}
              </span>
            </div>

            <p className='text-muted-foreground font-secondary'>
              {isFreePlan
                ? 'You’re on the free tier'
                : isCanceled
                  ? 'Your subscription will end on the next billing date'
                  : 'Your current subscription'}
            </p>
          </div>

          <Zap className='text-foreground h-6 w-6' />
        </div>

        {/* Billing Info */}
        <div className='border-accent/20 mb-8 space-y-3 border-t pt-6'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground font-secondary'>Monthly Price</span>
            <span className='font-semibold'>
              {isFreePlan ? 'Free' : `${currency} ${monthlyPrice.toLocaleString()}`}
            </span>
          </div>

          <div className='flex justify-between'>
            <span className='text-muted-foreground font-secondary'>Start Date</span>
            <span className='font-semibold'>{startDate}</span>
          </div>

          {!isFreePlan && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground font-secondary'>Next Billing Date</span>
              <span className='font-semibold'>{nextBillingDate}</span>
            </div>
          )}
        </div>

        {/* ✅ Change Plan ALWAYS visible */}
        <div className='flex items-center justify-end space-x-4'>
          {/* ✅ Cancel button ONLY for paid plans */}
          {!isFreePlan && (
            <div className='w-full md:w-1/2'>
              <NavLinkButton
                to='/organizations/dashboard/subscriptions/manage'
                className='w-full'
                variant='danger'
                leftIcon={<Ban />}
                disabled={isCanceled}
              >
                {isCanceled ? 'Already Canceling' : 'Cancel Subscription'}
              </NavLinkButton>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
