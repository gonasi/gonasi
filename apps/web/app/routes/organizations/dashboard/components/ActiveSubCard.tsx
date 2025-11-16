import { Ban, Clock, CloudAlert, Zap } from 'lucide-react';

import type {
  OrganizationSubscriptionType,
  OrganizationTier,
} from '@gonasi/database/organizationSubscriptions';

import { NavLinkButton } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface ActiveSubCardProps {
  subscription: OrganizationSubscriptionType;
  tier: OrganizationTier;
}

export function ActiveSubCard({ subscription, tier }: ActiveSubCardProps) {
  const isActive = subscription.status === 'active';
  const isCanceled = subscription.cancel_at_period_end;
  const isFreePlan = tier.tier === 'launch';
  const isTempPlan = tier.tier === 'temp';

  const hasScheduledDowngrade =
    subscription.next_tier &&
    subscription.next_tier !== subscription.tier &&
    subscription.downgrade_effective_at != null;

  const downgradeEffectiveDate = hasScheduledDowngrade
    ? new Date(subscription.downgrade_effective_at!).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const startDate = new Date(subscription.start_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const rawDate = subscription.initial_next_payment_date ?? subscription.current_period_end;
  const nextBillingDate =
    rawDate != null
      ? new Date(rawDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Unknown';

  const monthlyPrice = tier.price_monthly_usd;
  const currency = tier.plan_currency?.toUpperCase() || 'USD';
  const displayTier = subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1);

  // Dynamic status label
  let statusLabel = 'Active';
  let statusColor = 'bg-green-500/20 text-green-600';

  if (!isActive) {
    statusLabel = 'Inactive';
    statusColor = 'bg-destructive/20 text-destructive';
  } else if (isCanceled && !hasScheduledDowngrade) {
    statusLabel = 'Canceling';
    statusColor = 'bg-yellow-500/20 text-yellow-600';
  } else if (hasScheduledDowngrade) {
    statusLabel = 'Downgrade Scheduled';
    statusColor = 'bg-blue-500/20 text-blue-600';
  }

  return (
    <Card className={cn('border-border/50 rounded-none', isTempPlan && 'bg-danger/10')}>
      <CardContent className='p-4'>
        <div className='mb-4 flex items-start justify-between'>
          <div>
            <div className='mb-2 flex items-center gap-2'>
              <h2 className='text-2xl font-bold'>{isTempPlan ? 'No' : displayTier} Plan</h2>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>

            <p className='text-muted-foreground font-secondary'>
              {isTempPlan
                ? 'Get started by selecting a plan that’s right for you.'
                : isFreePlan
                  ? 'You’re on the free tier.'
                  : hasScheduledDowngrade
                    ? `You’ll remain on ${displayTier} until ${downgradeEffectiveDate}, then move to the ${subscription.next_tier?.charAt(0).toUpperCase() + subscription.next_tier?.slice(1)} tier.`
                    : isCanceled
                      ? 'Your subscription will end on the next billing date.'
                      : 'Your current subscription is active.'}
            </p>
          </div>

          {isTempPlan ? (
            <CloudAlert className='text-danger h-6 w-6' />
          ) : (
            <Zap className='text-foreground h-6 w-6' />
          )}
        </div>

        {isTempPlan ? null : (
          <>
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

              {hasScheduledDowngrade && (
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground font-secondary flex items-center gap-1'>
                    <Clock className='h-4 w-4' />
                    Downgrade Effective
                  </span>
                  <span className='font-semibold text-blue-600'>{downgradeEffectiveDate}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className='flex items-center justify-end space-x-4'>
              {!isFreePlan && (
                <div className='w-full md:w-1/2'>
                  <NavLinkButton
                    to='/organizations/dashboard/subscriptions/manage'
                    className='w-full'
                    variant={hasScheduledDowngrade ? 'ghost' : 'danger'}
                    leftIcon={hasScheduledDowngrade ? <Clock /> : <Ban />}
                    disabled={Boolean(isCanceled) || Boolean(hasScheduledDowngrade)}
                  >
                    {hasScheduledDowngrade
                      ? 'Downgrade Scheduled'
                      : isCanceled
                        ? 'Already Canceling'
                        : 'Cancel'}
                  </NavLinkButton>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
