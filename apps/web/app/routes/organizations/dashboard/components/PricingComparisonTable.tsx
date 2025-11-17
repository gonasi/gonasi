import { useParams } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Check, Info, Undo, X } from 'lucide-react';

import type {
  AllTiers,
  OrganizationSubscriptionType,
  OrganizationTier,
} from '@gonasi/database/organizationSubscriptions';
import type { Database } from '@gonasi/database/schema';

import { Badge } from '~/components/ui/badge';
import { IconTooltipButton, NavLinkButton } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface PricingComparisonTableProps {
  allTiers: AllTiers;
  activeTier: OrganizationTier;
  canSubToLaunchTier: boolean;
  canSwitchToLaunch: boolean;
  nextTier: Database['public']['Enums']['subscription_tier'] | null;
  subscription: OrganizationSubscriptionType;
}

/** Feature definitions */
const FEATURES = [
  { key: 'storage_limit_mb_per_org', name: 'Storage per Org', type: 'storage' },
  { key: 'max_members_per_org', name: 'Team Members', type: 'number' },
  { key: 'max_free_courses_per_org', name: 'Free Courses', type: 'number' },
  { key: 'ai_tools_enabled', name: 'AI Tools', type: 'boolean' },
  { key: 'ai_usage_limit_monthly', name: 'Monthly AI Usage', type: 'number' },
  { key: 'custom_domains_enabled', name: 'Custom Domains', type: 'boolean' },
  { key: 'max_custom_domains', name: 'Max Custom Domains', type: 'number' },
  { key: 'analytics_level', name: 'Analytics', type: 'text' },
  { key: 'support_level', name: 'Support', type: 'text' },
  { key: 'white_label_enabled', name: 'White Label', type: 'boolean' },
  { key: 'platform_fee_percentage', name: 'Platform Fee', type: 'percent' },
] as const;

function formatValue(value: any, type: string) {
  if (value == null) return '—';

  switch (type) {
    case 'boolean':
      return value ? <Check className='text-primary mx-auto h-5 w-5' /> : '—';
    case 'storage':
      return value >= 1024 ? `${(value / 1024).toFixed(1)} GB` : `${value} MB`;
    case 'text': {
      const str = String(value || '');
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';
    }
    case 'percent':
      return `${value}%`;
    default:
      return String(value ?? '—');
  }
}

export function PricingComparisonTable({
  allTiers,
  activeTier,
  canSubToLaunchTier,
  canSwitchToLaunch,
  nextTier,
  subscription,
}: PricingComparisonTableProps) {
  /** ✅ Sort plans by price ascending, impact always last */
  const sortedTiers = [...allTiers].sort((a, b) => {
    if (a.tier === 'impact') return 1;
    if (b.tier === 'impact') return -1;
    return a.price_monthly_usd - b.price_monthly_usd;
  });

  return (
    <motion.div
      className='w-full space-y-8'
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Mobile */}
      <div className='space-y-6 md:hidden'>
        {sortedTiers
          .filter(
            (plan) => !(plan.tier === 'launch' && (!canSubToLaunchTier || !canSwitchToLaunch)),
          )
          .map((plan, i) => {
            const isCanceling =
              subscription.tier === plan.tier &&
              subscription.cancel_at_period_end &&
              subscription.next_tier === 'temp';

            const canCancelActivePlan =
              plan.tier !== 'launch' &&
              plan.tier !== 'temp' &&
              subscription.tier === plan.tier &&
              !subscription.cancel_at_period_end &&
              !subscription.next_tier &&
              subscription.status === 'active';

            return (
              <MobilePlanCard
                key={plan.tier}
                plan={plan}
                isActive={plan.tier === activeTier.tier}
                isNextTier={plan.tier === nextTier}
                index={i}
                canSubToLaunchTier={canSubToLaunchTier}
                canSwitchToLaunch={canSwitchToLaunch}
                activeTier={activeTier.tier}
                isCanceling={isCanceling}
                canCancelActivePlan={canCancelActivePlan}
              />
            );
          })}
      </div>

      {/* Desktop */}
      <motion.div
        className='hidden overflow-x-auto md:block'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
      >
        <table className='border-border w-full overflow-hidden border text-sm shadow-sm'>
          <thead>
            <tr className='border-border bg-muted/40 border-b'>
              <th className='px-6 py-4 text-left font-semibold'>Features</th>

              {sortedTiers.map((plan, i) => {
                const isActive = plan.tier === activeTier.tier;
                const isNextTier = plan.tier === nextTier;
                const canSubToLaunch = plan.tier === 'launch' && canSubToLaunchTier;
                const isDisabled =
                  (plan.tier === 'launch' && !canSubToLaunchTier) ||
                  (plan.tier === 'launch' && !canSwitchToLaunch);
                const isCanceling =
                  subscription.tier === plan.tier &&
                  subscription.cancel_at_period_end &&
                  subscription.next_tier === 'temp';

                const canCancelActivePlan =
                  plan.tier !== 'launch' &&
                  plan.tier !== 'temp' &&
                  subscription.tier === plan.tier &&
                  !subscription.cancel_at_period_end &&
                  !subscription.next_tier &&
                  subscription.status === 'active';

                return (
                  <motion.th
                    key={plan.tier}
                    className={cn(
                      'px-6 py-4 text-center align-top transition-all',
                      isActive && 'bg-primary/5 border-primary relative border-2 shadow-md',
                      isNextTier && 'border-warning/80 bg-warning/5 relative border-2 shadow-md',
                      isDisabled && 'bg-card cursor-not-allowed opacity-30 shadow-md',
                    )}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.25 }}
                  >
                    <div className='flex flex-col items-center gap-3'>
                      <div className='flex items-center justify-center gap-2'>
                        <h3 className='text-lg font-bold'>
                          {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                        </h3>

                        {isActive && <Badge variant='success'>Active</Badge>}

                        {isNextTier && (
                          <span className='rounded-full bg-blue-500 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-white uppercase'>
                            Next
                          </span>
                        )}
                      </div>

                      <div className='text-2xl font-bold'>
                        ${plan.price_monthly_usd}
                        <span className='text-muted-foreground text-xs'>/mo</span>
                      </div>

                      <PlanCTA
                        isActive={isActive}
                        isNextTier={isNextTier}
                        tier={plan.tier}
                        canSubToLaunch={canSubToLaunch}
                        activeTier={activeTier.tier}
                        canSwitchToLaunch={canSwitchToLaunch}
                        isCanceling={isCanceling}
                        canCancelActivePlan={canCancelActivePlan}
                      />
                    </div>
                  </motion.th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {FEATURES.map((f, idx) => (
              <motion.tr
                key={f.key}
                className={cn(
                  'border-border border-b',
                  idx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + idx * 0.02, duration: 0.25 }}
              >
                <td className='px-6 py-4 font-medium'>{f.name}</td>

                {sortedTiers.map((plan) => {
                  const isActive = plan.tier === activeTier.tier;
                  const isNextTier = plan.tier === nextTier;
                  const isDisabled =
                    (plan.tier === 'launch' && !canSubToLaunchTier) ||
                    (plan.tier === 'launch' && !canSwitchToLaunch);

                  return (
                    <td
                      key={plan.tier + f.key}
                      className={cn(
                        'px-6 py-4 text-center transition-all',
                        isActive && 'bg-primary/5 border-primary border-x-2 shadow-inner',
                        isNextTier && 'border-warning/80 bg-warning/5 border-x-2 shadow-inner',
                        isDisabled && 'opacity-30',
                      )}
                    >
                      {formatValue((plan as any)[f.key], f.type)}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td />
              {sortedTiers.map((plan) => {
                const isActive = plan.tier === activeTier.tier;
                const isNextTier = plan.tier === nextTier;
                return (
                  <td
                    key={`${plan.tier}-bottom`}
                    className={cn(
                      '',
                      isActive && 'border-primary rounded-b-xl border-b-2',
                      isNextTier && 'border-warning/80 rounded-b-xl border-b-2',
                    )}
                  />
                );
              })}
            </tr>
          </tfoot>
        </table>
      </motion.div>
    </motion.div>
  );
}

function PlanCTA({
  isActive,
  isNextTier,
  tier,
  canSubToLaunch,
  canSwitchToLaunch,
  activeTier,
  isCanceling,
  canCancelActivePlan,
}: {
  isActive: boolean;
  isNextTier: boolean;
  tier: string;
  canSubToLaunch: boolean;
  canSwitchToLaunch: boolean;
  activeTier: string;
  isCanceling: boolean;
  canCancelActivePlan: boolean;
}) {
  const params = useParams();

  if (canCancelActivePlan) {
    return (
      <NavLinkButton
        to={`/${params.organizationId}/dashboard/subscriptions/temp`}
        variant='danger'
        className='rounded-full'
        size='sm'
        leftIcon={<X />}
      >
        Cancel Plan
      </NavLinkButton>
    );
  }

  if (isCanceling)
    return (
      <NavLinkButton
        to={`/${params.organizationId}/dashboard/subscriptions/${tier}`}
        variant='success'
        className='rounded-full'
        size='sm'
        leftIcon={<Undo />}
      >
        Undo Cancellation
      </NavLinkButton>
    );

  if (isActive) return <></>;

  if (isNextTier) {
    return (
      <NavLinkButton
        to={`/${params.organizationId}/dashboard/subscriptions/${activeTier}`}
        variant='warning'
        className='rounded-full'
        size='sm'
        leftIcon={<X />}
      >
        Cancel Downgrade
      </NavLinkButton>
    );
  }

  if (tier === 'launch' && (!canSubToLaunch || !canSwitchToLaunch)) {
    return (
      <IconTooltipButton
        title={
          !canSwitchToLaunch
            ? 'You have an organization with a scheduled downgrade to Launch Plan'
            : 'You already have a Launch subscription on another organization. Only one Launch subscription is allowed per user.'
        }
        icon={Info}
      />
    );
  }

  return (
    <NavLinkButton
      to={`/${params.organizationId}/dashboard/subscriptions/${tier}`}
      size='sm'
      className='rounded-full'
      leftIcon={<ArrowRightLeft />}
    >
      Change Plan
    </NavLinkButton>
  );
}

function MobilePlanCard({
  plan,
  isActive,
  isNextTier,
  index,
  canSubToLaunchTier,
  canSwitchToLaunch,
  activeTier,
  isCanceling,
  canCancelActivePlan,
}: {
  plan: OrganizationTier;
  isActive: boolean;
  isNextTier: boolean;
  index: number;
  canSubToLaunchTier: boolean;
  canSwitchToLaunch: boolean;
  activeTier: string;
  isCanceling: boolean;
  canCancelActivePlan: boolean;
}) {
  const isDisabled =
    (plan.tier === 'launch' && !canSubToLaunchTier) ||
    (plan.tier === 'launch' && !canSwitchToLaunch);

  return (
    <motion.div
      className={cn(
        'space-y-6 rounded-2xl border p-6 shadow-sm backdrop-blur-sm',
        isActive
          ? 'border-primary bg-primary/5 shadow-md'
          : isNextTier
            ? 'border-warning/80 bg-warning/5 shadow-md'
            : isDisabled
              ? 'bg-card border-border cursor-not-allowed opacity-30'
              : 'bg-card border-border',
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35, ease: 'easeOut' }}
    >
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-xl font-bold'>
            {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
          </h3>

          {isActive && <Badge variant='success'>Active</Badge>}

          {isNextTier && (
            <span className='rounded-full bg-blue-500 px-3 py-1 text-xs text-white'>Next</span>
          )}
        </div>

        <div className='text-2xl font-bold'>
          ${plan.price_monthly_usd}
          <span className='text-muted-foreground text-sm'>/mo</span>
        </div>

        <PlanCTA
          isActive={isActive}
          isNextTier={isNextTier}
          tier={plan.tier}
          canSubToLaunch={canSubToLaunchTier}
          activeTier={activeTier}
          canSwitchToLaunch={canSwitchToLaunch}
          isCanceling={isCanceling}
          canCancelActivePlan={canCancelActivePlan}
        />
      </div>

      <div className='border-border space-y-3 border-t pt-6'>
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.key}
            className='flex justify-between text-sm'
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.02, duration: 0.25 }}
          >
            <span className='text-muted-foreground'>{f.name}</span>
            <span className='font-medium'>{formatValue((plan as any)[f.key], f.type)}</span>
          </motion.div>
        ))}
      </div>

      <div className='border-border text-muted-foreground border-t pt-4 text-xs'>
        Platform fee: {plan.platform_fee_percentage}%
      </div>
    </motion.div>
  );
}
