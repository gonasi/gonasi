import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  initializeOrganizationTierSubscription,
  type OrganizationTierChangeRequestSuccessResponse,
  type TierLimitsRow,
  VALID_TIER_ORDER,
  validateTierChangeRequest,
} from '@gonasi/database/organizationSubscriptions';
import {
  OrganizationTierChangeSchema,
  type OrganizationTierChangeSchemaTypes,
} from '@gonasi/schemas/subscriptions';

import type { Route } from './+types/subscribe-to-tier';

import { getServerEnv } from '~/.server/env.server';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(OrganizationTierChangeSchema);

const { BASE_URL } = getServerEnv();

/** Feature definitions */
const FEATURES = [
  { key: 'storage_limit_mb_per_org', name: 'Storage per Org', type: 'storage' },
  { key: 'max_members_per_org', name: 'Team Members', type: 'number' },
  { key: 'max_free_courses_per_org', name: 'Free Courses', type: 'number' },

  // Optional / advanced features (hidden by default)
  // { key: 'ai_tools_enabled', name: 'AI Tools', type: 'boolean' },
  // { key: 'ai_usage_limit_monthly', name: 'Monthly AI Usage', type: 'number' },
  // { key: 'custom_domains_enabled', name: 'Custom Domains', type: 'boolean' },
  // { key: 'max_custom_domains', name: 'Max Custom Domains', type: 'number' },
  // { key: 'white_label_enabled', name: 'White Label', type: 'boolean' },

  { key: 'analytics_level', name: 'Analytics', type: 'text' },
  { key: 'support_level', name: 'Support', type: 'text' },
  { key: 'platform_fee_percentage', name: 'Platform Fee', type: 'percent' },
] as const;

function formatValue(value: any, type: string) {
  if (value == null || value === undefined) return '—';

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

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase, supabaseAdmin } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<OrganizationTierChangeSchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  const {
    success,
    message,
    data: successData,
  } = await initializeOrganizationTierSubscription({
    supabase,
    supabaseAdmin,
    data: { ...data, baseUrl: BASE_URL },
  });

  return success
    ? redirectWithSuccess(
        successData
          ? `${successData?.data.authorization_url}`
          : `/${params.organizationId}/dashboard/subscriptions`,
        message,
      )
    : dataWithError(null, message);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { organizationId, tier: tierParam } = params;

  if (!tierParam || !VALID_TIER_ORDER.includes(tierParam as TierLimitsRow)) {
    return redirectWithError(
      `/${organizationId}/dashboard/subscriptions`,
      'Invalid tier selected.',
    );
  }

  const targetTier = tierParam as TierLimitsRow;
  const validation = await validateTierChangeRequest({
    supabase,
    organizationId,
    targetTier,
  });

  if (!validation.success) {
    return redirectWithError(
      `/${organizationId}/dashboard/subscriptions`,
      validation.message ?? 'You do not have permission to manage subscriptions.',
    );
  }

  return validation as OrganizationTierChangeRequestSuccessResponse;
}

export default function SubscribeToTier({ params, loaderData }: Route.ComponentProps) {
  const { currentTier, targetTier, isUpgrade, isDowngrade, canProceed, warnings, data } =
    loaderData;

  const form = useRemixForm<OrganizationTierChangeSchemaTypes>({
    mode: 'all',
    resolver: zodResolver(OrganizationTierChangeSchema),
    defaultValues: {
      organizationId: params.organizationId,
      tier: params.tier as TierLimitsRow,
      baseUrl: '',
    },
  });

  const isPending = useIsPending();
  const isDisabled = isPending || form.formState.isSubmitting;

  // Check for scheduled changes - with proper null handling
  const subscription = data.subscription;
  const hasScheduledChange = subscription.next_tier != null;
  const scheduledTier = subscription.next_tier;
  // const isCanceling = subscription.cancel_at_period_end;
  const downgradeEffectiveDate = subscription.downgrade_effective_at
    ? new Date(subscription.downgrade_effective_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Determine the relationship between target tier and scheduled tier
  const isTargetSameAsScheduled = scheduledTier !== null && targetTier === scheduledTier;
  const isTargetSameAsCurrent = targetTier === currentTier;

  // Calculate tier indices for comparison
  const currentIndex = VALID_TIER_ORDER.indexOf(currentTier);
  const targetIndex = VALID_TIER_ORDER.indexOf(targetTier);
  const scheduledIndex = scheduledTier ? VALID_TIER_ORDER.indexOf(scheduledTier) : -1;

  // =========================
  // Action Intent + Copy Text
  // =========================

  type ActionType =
    | 'no-change'
    | 'cancel-scheduled'
    | 'upgrade'
    | 'downgrade'
    | 'cancel-subscription'
    | 'override-change';

  let actionType: ActionType = 'no-change';
  let actionDescription = '';
  let icon = <Info className='text-blue-500' />;
  let title = `Manage ${formatTier(targetTier)} tier`;

  // helper display formatter for tiers
  function formatTier(t: string) {
    if (!t) return '';
    if (t === 'temp') return 'Temporary';
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  const scheduledTierDisplay = scheduledTier ? formatTier(scheduledTier) : null;
  const targetTierDisplay = formatTier(targetTier);
  const currentTierDisplay = formatTier(currentTier);

  // --- 1. No change ---
  if (isTargetSameAsCurrent && !hasScheduledChange) {
    actionType = 'no-change';
    title = `Already on ${currentTierDisplay}`;
    icon = <CheckCircle2 className='text-green-500' />;
    actionDescription = `You're already on the ${currentTierDisplay} plan and no changes are scheduled.`;
  }

  // --- 2. Cancel scheduled cancellation (next_tier === 'temp') ---
  else if (isTargetSameAsScheduled && scheduledTier === 'temp') {
    actionType = 'cancel-scheduled';
    title = `Cancel Scheduled Cancellation`;
    icon = <X className='text-yellow-600' />;

    actionDescription = `Your subscription is scheduled to end on ${downgradeEffectiveDate ?? 'the end of your billing period'}. Canceling this will keep your ${currentTierDisplay} plan active.`;
  }

  // --- 3. Cancel scheduled downgrade/upgrade (generic) ---
  else if (isTargetSameAsScheduled && hasScheduledChange && scheduledTier) {
    actionType = 'cancel-scheduled';
    const isScheduledDowngrade = scheduledIndex < currentIndex;

    title = isScheduledDowngrade ? `Cancel Scheduled Downgrade` : `Cancel Scheduled Change`;
    icon = <X className='text-yellow-600' />;

    actionDescription = `You have a ${isScheduledDowngrade ? 'downgrade' : 'change'} to ${scheduledTierDisplay} scheduled for ${downgradeEffectiveDate ?? 'the end of your billing period'}. Canceling will keep you on the ${currentTierDisplay} plan.`;
  }

  // --- 4. Override scheduled change with a new change (target different from scheduled) ---
  else if (hasScheduledChange && scheduledTier && targetIndex !== scheduledIndex) {
    actionType = 'override-change';
    const isUpgradeOverride = targetIndex > currentIndex;

    title = isUpgradeOverride
      ? `Upgrade to ${targetTierDisplay}`
      : `Change to ${targetTierDisplay}`;
    icon = isUpgradeOverride ? (
      <ArrowUpRight className='text-success' />
    ) : (
      <ArrowDownRight className='text-warning' />
    );

    actionDescription = `You currently have a change scheduled to ${scheduledTierDisplay} on ${downgradeEffectiveDate ?? 'the end of your billing period'}. This will cancel that scheduled change and move you to ${targetTierDisplay} instead.`;
  }

  // --- 5. Upgrade now (immediate) ---
  else if (isUpgrade) {
    actionType = 'upgrade';
    title = `Upgrade to ${targetTierDisplay}`;
    icon = <ArrowUpRight className='text-success' />;
    actionDescription = hasScheduledChange
      ? `This will override your scheduled change and upgrade you immediately to the ${targetTierDisplay} plan.`
      : `Upgrade now to unlock more features and higher limits.`;
  }

  // --- 6. Cancel subscription (downgrade to temp) ---
  else if (isDowngrade && targetTier === 'temp') {
    actionType = 'cancel-subscription';
    title = `Cancel Subscription`;
    icon = <ArrowDownLeft className='text-warning' />;
    actionDescription = `You’ll keep access to your ${currentTierDisplay} plan until ${downgradeEffectiveDate ?? 'the end of your billing period'}. After that, your subscription will be canceled and moved to a temporary plan with reduced access.`;
  }

  // --- 7. Normal downgrade (effective at end of period) ---
  else if (isDowngrade) {
    actionType = 'downgrade';
    title = `Downgrade to ${targetTierDisplay}`;
    icon = <ArrowDownRight className='text-warning' />;
    actionDescription = hasScheduledChange
      ? `This will replace your scheduled change with a downgrade to ${targetTierDisplay}, effective at the end of your billing period.`
      : `Your downgrade will take effect at the end of your current billing period. You’ll retain full access until then.`;
  }

  // ---------------------
  // Button configuration
  // ---------------------
  let buttonText = 'Confirm';
  let buttonVariant: 'success' | 'danger' | 'default' | 'secondary' = 'default';
  let buttonIcon = <ArrowUpRight />;

  // More explicit labels so undoing cancellation/downgrade never shows the generic "Confirm Change"
  if (actionType === 'cancel-scheduled') {
    // If scheduledTier is 'temp' it's a cancellation undo; if it's a downgrade undo show "Undo Downgrade"
    const isScheduledDowngrade = scheduledIndex < currentIndex;
    if (scheduledTier === 'temp') {
      buttonText = 'Cancel Cancellation';
    } else if (isScheduledDowngrade) {
      buttonText = 'Undo Downgrade';
    } else {
      buttonText = 'Cancel Scheduled Change';
    }
    buttonVariant = 'secondary';
    buttonIcon = <X />;
  } else if (actionType === 'upgrade') {
    buttonText = 'Confirm Upgrade';
    buttonVariant = 'success';
    buttonIcon = <ArrowUpRight />;
  } else if (actionType === 'override-change') {
    // Replace scheduled change with a new one — explicit text
    const isOverrideUpgrade = targetIndex > currentIndex;
    buttonText = isOverrideUpgrade
      ? 'Confirm Upgrade (Replace Scheduled)'
      : 'Confirm Change (Replace Scheduled)';
    buttonVariant = isOverrideUpgrade ? 'success' : 'danger';
    buttonIcon = isOverrideUpgrade ? <ArrowUpRight /> : <ArrowDownRight />;
  } else if (actionType === 'cancel-subscription') {
    buttonText = 'Confirm Cancellation';
    buttonVariant = 'danger';
    buttonIcon = <ArrowDownLeft />;
  } else if (actionType === 'downgrade') {
    buttonText = targetTier === 'temp' ? 'Confirm Cancellation' : 'Confirm Downgrade';
    buttonVariant = 'danger';
    buttonIcon = <ArrowDownLeft />;
  } else if (actionType === 'no-change') {
    buttonText = 'No Action Needed';
    buttonVariant = 'secondary';
    buttonIcon = <CheckCircle2 />;
  }

  const shouldDisableAction =
    !canProceed || isDisabled || (isTargetSameAsCurrent && !hasScheduledChange);

  // Helper: display label for 'temp' tier in badges (friendly)
  const displayTier = (t: string) => (t === 'temp' ? 'Temporary' : t);

  return (
    <Modal open>
      <Modal.Content size='lg'>
        <Modal.Header
          title={title}
          leadingIcon={icon}
          closeRoute={`/${params.organizationId}/dashboard/subscriptions`}
        />
        <Modal.Body className='space-y-6 px-4 pb-6'>
          {/* Action Description */}
          <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <p className='text-sm text-blue-900'>{actionDescription}</p>
          </div>

          {/* Summary */}
          <div className='bg-muted/40 rounded-none border-none p-4'>
            <p className='text-muted-foreground mb-2 text-sm'>
              Current Tier:
              <Badge variant='outline' className='ml-2 capitalize'>
                {displayTier(currentTier)}
              </Badge>
            </p>
            {hasScheduledChange && scheduledTier && (
              <p className='text-muted-foreground mb-2 text-sm'>
                Scheduled Tier:
                <Badge variant='outline' className='ml-2 text-yellow-600 capitalize'>
                  {displayTier(scheduledTier)}
                </Badge>
                {downgradeEffectiveDate && (
                  <span className='ml-2 text-xs'>(effective {downgradeEffectiveDate})</span>
                )}
              </p>
            )}
            <p className='text-muted-foreground text-sm'>
              {actionType === 'cancel-scheduled' ? 'Will remain on:' : 'Target Tier:'}
              <Badge
                variant='secondary'
                className={cn(
                  'ml-2 capitalize',
                  actionType === 'upgrade' && 'bg-success/20 text-success',
                  actionType === 'downgrade' && 'bg-warning/20 text-warning',
                  actionType === 'cancel-scheduled' && 'bg-blue-100 text-blue-700',
                )}
              >
                {actionType === 'cancel-scheduled'
                  ? displayTier(currentTier)
                  : displayTier(targetTier)}
              </Badge>
            </p>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className='space-y-4'>
              {warnings.map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border p-3 text-sm',
                    w.type === 'error' && 'border-red-400 bg-red-50 text-red-700',
                    w.type === 'warning' && 'border-yellow-400 bg-yellow-50 text-yellow-700',
                    w.type === 'info' && 'border-blue-400 bg-blue-50 text-blue-700',
                  )}
                >
                  {w.type === 'error' && <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />}
                  <span>{w.message}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Comparison Table */}
          {!(isTargetSameAsCurrent && !hasScheduledChange) && (
            <div className='rounded-NONE overflow-hidden'>
              <div className='bg-muted/30 grid grid-cols-3 p-2 text-sm font-semibold'>
                <span>Feature</span>
                <span className='text-center capitalize'>{displayTier(currentTier)}</span>
                <span className='text-center capitalize'>{displayTier(targetTier)}</span>
              </div>

              {FEATURES.map((feature) => {
                const currentVal = data.currentTierLimits[feature.key];
                const targetVal =
                  actionType === 'cancel-scheduled'
                    ? data.currentTierLimits[feature.key]
                    : data.targetTierLimits[feature.key];

                const changed = currentVal !== targetVal;

                return (
                  <div
                    key={feature.key}
                    className={cn(
                      'grid grid-cols-3 border-t p-2 text-sm',
                      changed && 'bg-green-50/60',
                    )}
                  >
                    <span>{feature.name}</span>
                    <span className='text-center'>{formatValue(currentVal, feature.type)}</span>
                    <span className='text-center font-medium'>
                      {formatValue(targetVal, feature.type)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <RemixFormProvider {...form}>
            <Form method='POST' onSubmit={form.handleSubmit}>
              <HoneypotInputs />
              <div className='flex justify-end gap-3 border-t pt-4'>
                <Button
                  variant={buttonVariant}
                  type='submit'
                  disabled={shouldDisableAction}
                  isLoading={isDisabled}
                  rightIcon={buttonIcon}
                >
                  {buttonText}
                </Button>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
