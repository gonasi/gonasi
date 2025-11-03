import { useEffect } from 'react';
import { useFetcher, useParams } from 'react-router';
import { AlertTriangle, ArrowUpRight, Crown } from 'lucide-react';

import type { FetchOrganizationSubscriptionStatusResponse } from '@gonasi/database/organizationSubscriptions';

import { Badge } from '~/components/ui/badge';
import { NavLinkButton } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { useIsPending } from '~/utils/misc';

export function OrganizationPlanCard() {
  const fetcher = useFetcher();
  const { organizationId } = useParams();
  const isPending = useIsPending();

  const isLoading = fetcher.state === 'loading' || fetcher.state === 'submitting' || isPending;

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data && organizationId) {
      fetcher.load(`/api/dashboard/fetch-organization-subscription-status/${organizationId}`);
    }
  }, [fetcher, organizationId]);

  // Don't access result until fetcher.data exists
  const result = fetcher.data as FetchOrganizationSubscriptionStatusResponse | undefined;
  const hasError = result?.success === false;
  const data = result?.data;

  const subscription = data?.subscription;
  const tier = data?.tier;

  // ---------------------------------------------
  // Skeleton loading state (mimics content layout)
  // ---------------------------------------------
  if (isLoading || (!fetcher.data && !hasError)) {
    return (
      <Card className='border-border/50 rounded-none'>
        <CardContent className='p-4'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-24' /> {/* Current Plan label */}
              <Skeleton className='h-8 w-40' /> {/* Plan title */}
              <Skeleton className='h-4 w-56' /> {/* Plan description */}
            </div>
            <Skeleton className='h-12 w-12 rounded-lg' /> {/* Icon */}
          </div>
          <div className='mb-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-10' />
            </div>
            <div className='flex justify-between text-sm'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-10' />
            </div>
            <div className='flex justify-between text-sm'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-20' />
            </div>
          </div>
          <Skeleton className='h-9 w-full' /> {/* Upgrade button */}
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------
  // Error or missing data
  // ---------------------------------------------
  if (hasError || !subscription || !tier) {
    return (
      <Card className='border-border/50 rounded-none'>
        <CardContent className='text-muted-foreground flex items-center justify-center p-6 text-sm'>
          <AlertTriangle className='text-destructive mr-2 h-4 w-4' />
          Failed to load organization plan
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------
  // Plan sequencing logic
  // ---------------------------------------------
  const plans = ['launch', 'scale', 'impact', 'enterprise'] as const;
  const currentIndex = plans.indexOf(tier.tier as (typeof plans)[number]);
  const nextPlan =
    currentIndex >= 0 && currentIndex < plans.length - 1 ? plans[currentIndex + 1] : null;

  // Format next renewal date if present
  const nextRenewal = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  // ---------------------------------------------
  // Render actual plan info
  // ---------------------------------------------
  return (
    <Card className='border-border/50 rounded-none'>
      <CardContent className='p-4'>
        <div className='mb-4 flex items-start justify-between'>
          <div className='flex-1'>
            <div className='mb-1 flex items-center gap-2'>
              <p className='text-muted-foreground text-sm font-medium'>Current Plan</p>
              {subscription.status === 'active' ? (
                <Badge variant='success'>Active</Badge>
              ) : (
                <Badge variant='secondary' className='bg-muted text-foreground'>
                  {subscription.status}
                </Badge>
              )}
            </div>

            <h3 className='text-foreground mb-2 text-3xl font-bold capitalize'>{tier.tier}</h3>
            <p className='text-muted-foreground font-secondary text-sm'>
              {tier.support_level === 'community'
                ? 'Community plan for small teams and creators'
                : `Includes ${tier.support_level} support`}
            </p>
          </div>

          <div className='bg-background/20 flex h-12 w-12 items-center justify-center rounded-lg'>
            <Crown className='h-6 w-6' />
          </div>
        </div>

        <div className='mb-4 space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Members</span>
            <span className='text-foreground font-medium'>
              {/* Replace 1 with actual org member count if available */}1 /{' '}
              {tier.max_members_per_org ?? '—'}
            </span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>AI Credits</span>
            <span className='text-foreground font-medium'>
              {tier.ai_usage_limit_monthly?.toLocaleString() ?? 0} / month
            </span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Next Renewal</span>
            <span className='text-foreground font-medium'>{nextRenewal}</span>
          </div>
        </div>

        {/* --------------------------------------------- */}
        {/* Dynamic Upgrade CTA */}
        {/* --------------------------------------------- */}
        <NavLinkButton
          to={`/${organizationId}/dashboard/subscriptions`}
          rightIcon={<ArrowUpRight />}
          className='w-full'
          variant='secondary'
        >
          {nextPlan
            ? `Upgrade to ${nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1)} Plan`
            : 'Manage Subscriptions'}
        </NavLinkButton>
      </CardContent>
    </Card>
  );
}
