/**
 * initializeOrganizationTierSubscription.ts
 *
 * Handles organization subscription tier changes (upgrade, downgrade, reactivation, or new subscription)
 * with Paystack and Supabase integration.
 *
 * Fully supports:
 *  - Scheduled downgrades (non-renewing flow)
 *  - Reactivation by canceling a scheduled downgrade
 *  - Downgrade to free tier ("launch")
 *  - Preventing invalid transitions
 */

import type { OrganizationTierChangeSchemaTypes } from '@gonasi/schemas/subscriptions';

import type { TypedSupabaseClient } from '../client';
import { getUserOrgRole } from '../organizations/getUserOrgRole';
import type { ProfileWithSignedUrl } from '../profile';
import { getUserProfile } from '../profile';
import type { Database } from '../schema';
import type { PaystackSubscriptionResponse } from './organizationSubscriptionsTypes';
import type { TierLimitsRow } from './validateTierChangeRequest';
import { VALID_TIER_ORDER } from './validateTierChangeRequest';

// ---------------------------------------------------------------------------
// Tier constants & types
// ---------------------------------------------------------------------------
const VALID_UPGRADE_TIER_ORDER: TierLimitsRow[] = ['scale', 'impact'];

type Tier = (typeof VALID_UPGRADE_TIER_ORDER)[number] | 'launch';
type ChangeType = 'start' | 'upgrade' | 'downgrade' | 'reactivation' | 'new' | 'same';
type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

// ---------------------------------------------------------------------------
// Utility: Determine change type
// ---------------------------------------------------------------------------
/**
 * Determine the kind of subscription change the user is attempting.
 * Handles active, non-renewing (scheduled downgrade), cancelled, completed, and free (launch) cases.
 */
const determineChangeType = (
  currentTier: Tier | null,
  currentStatus: SubscriptionStatus | null,
  targetTier: Tier,
  nextTier: Tier | null = null,
  downgradeRequestedAt: string | null = null,
): ChangeType => {
  if (currentTier === 'temp' && targetTier === 'launch') return 'start';

  // No subscription or on free tier → new
  if (!currentTier || currentTier === 'launch') return 'new';

  // Block payment issues
  if (currentStatus === 'attention') return 'same';

  // Reactivation after full termination
  if (currentStatus === 'cancelled' || currentStatus === 'completed') return 'reactivation';

  const currentIndex = VALID_TIER_ORDER.indexOf(currentTier);
  const targetIndex = VALID_TIER_ORDER.indexOf(targetTier);

  // Non-renewing state: has scheduled downgrade
  if (currentStatus === 'non-renewing') {
    if (nextTier) {
      if (targetTier === nextTier) return 'same'; // already scheduled
      if (targetTier === currentTier) return 'reactivation'; // cancel downgrade
      if (targetIndex > currentIndex) return 'upgrade'; // cancel downgrade + upgrade
      if (targetIndex < currentIndex) return 'downgrade'; // reschedule different downgrade
      return 'same';
    }

    // Non-renewing but no scheduled downgrade → treat like active
    if (targetTier === currentTier) return 'reactivation';
    if (targetIndex > currentIndex) return 'upgrade';
    if (targetIndex < currentIndex) return 'downgrade';
    return 'same';
  }

  // Active (normal flow)
  if (targetIndex > currentIndex) return 'upgrade';
  if (targetIndex < currentIndex) return 'downgrade';
  return 'same';
};

// ---------------------------------------------------------------------------
// Handlers for each change type
// ---------------------------------------------------------------------------

async function handleUpgrade({
  supabase,
  organizationId,
  targetTier,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
  targetTier: Tier;
}): Promise<InitializeOrgTierSubSuccess | InitializeOrgTierSubError> {
  console.log('🚀 Upgrade logic', { organizationId, targetTier });

  const payload = { organizationId, targetTier };

  const { data: txResponse, error: txError } =
    await supabase.functions.invoke<PaystackSubscriptionResponse>(
      'initialize-paystack-subscription-upgrade-transaction',
      { body: payload },
    );

  if (txError || !txResponse?.success) {
    return { success: false, message: 'Failed to initialize upgrade payment.', data: null };
  }

  return {
    success: true,
    message: 'Upgrade payment initialized successfully.',
    data: txResponse.data,
    changeType: 'upgrade',
  };
}

/**
 * Handles downgrade requests.
 * - Paid → Paid: schedules downgrade (non-renewing)
 * - Paid → Free (launch): immediately downgrades to free plan and cancels Paystack sub
 */
async function handleDowngrade({
  supabase,
  organizationId,
  targetTier,
  currentTier,
  currentStatus,
  currentPeriodEnd,
  userId,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
  targetTier: Tier;
  currentTier: Tier;
  currentStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  userId: string;
}): Promise<InitializeOrgTierSubSuccess | InitializeOrgTierSubError> {
  console.log('⚠️ Downgrade logic', {
    organizationId,
    targetTier,
    currentTier,
    currentStatus,
    currentPeriodEnd,
    userId,
  });

  const { data: canSwitchToLaunch } = await supabase.rpc('can_switch_to_launch_tier', {
    p_org_id: organizationId,
  });

  if (!canSwitchToLaunch && targetTier === 'launch') {
    return {
      success: false,
      message: 'User already has a launch plan or launch downgrade scheduled.',
      data: null,
    };
  }

  // Paid downgrade (schedule for next cycle)
  const { data: tierRow, error: tierErr } = await supabase
    .from('tier_limits')
    .select('tier, paystack_plan_code')
    .eq('tier', targetTier)
    .single();

  if (
    tierErr ||
    (!tierRow?.paystack_plan_code &&
      tierRow.tier !== 'launch' &&
      !(targetTier === 'temp' && currentTier !== 'launch'))
  ) {
    return {
      success: false,
      message: `Target tier ${targetTier} is missing Paystack configuration.`,
      data: null,
    };
  }

  const payload = {
    organizationId,
    targetTier,
    newPlanCode: tierRow.paystack_plan_code,
    userId,
    isCancellation: targetTier === 'temp' && currentTier !== 'launch',
  };

  const { data: downgradeResponse, error: downgradeError } = await supabase.functions.invoke<{
    success: boolean;
    message: string;
    data: { targetTier: string; status: string; effectiveDate?: string };
  }>('org-subscriptions-downgrade', { body: payload });

  if (downgradeError || !downgradeResponse?.success) {
    console.error('Downgrade failed:', downgradeError || downgradeResponse);
    return {
      success: false,
      message: downgradeResponse?.message || 'Failed to process downgrade.',
      data: null,
    };
  }

  return {
    success: true,
    message: downgradeResponse.message,
    data: null,
    changeType: 'downgrade',
  };
}

/**
 * Reactivation handler:
 * 1. If subscription was cancelled/completed → create new Paystack sub
 * 2. If scheduled downgrade existed → cancel it and resume renewal
 */
export async function handleReactivation({
  supabaseAdmin,
  organizationId,
  targetTier,
  currentTier,
  userId,
  cancelScheduledDowngrade = false,
}: {
  supabaseAdmin: TypedSupabaseClient;
  organizationId: string;
  targetTier: Tier;
  currentTier: Tier;
  userId: string;
  cancelScheduledDowngrade?: boolean;
}): Promise<InitializeOrgTierSubSuccess | InitializeOrgTierSubError> {
  console.log('🔁 Reactivation logic (via Edge Function)', {
    organizationId,
    targetTier,
    cancelScheduledDowngrade,
  });

  try {
    // Call the reactivation Edge Function
    const { data, error } = await supabaseAdmin.functions.invoke('org-subscriptions-reactivate', {
      body: JSON.stringify({
        organizationId,
        targetTier,
        currentTier,
        userId,
        cancelScheduledDowngrade,
      }),
    });

    if (error) {
      console.error('❌ Edge function invocation failed', error);
      return {
        success: false,
        message: 'Failed to invoke reactivation function',
        data: null,
      };
    }

    // The Edge Function returns JSON in `data`
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return {
      success: result.success ?? false,
      message: result.message ?? 'No message returned',
      data: result.data ?? null,
      changeType: result.changeType,
    };
  } catch (err) {
    console.error('❌ Exception calling reactivation Edge Function', err);
    return {
      success: false,
      message: 'Unexpected error calling reactivation function',
      data: null,
    };
  }
}

/**
 * Creates a new subscription (temp to launch)
 */
async function handleStartSubscription({
  supabase,
  organizationId,
  targetTier,
  userProfile,
  baseUrl,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
  targetTier: Tier;
  userProfile: ProfileWithSignedUrl;
  baseUrl: string;
}): Promise<InitializeOrgTierSubSuccess | InitializeOrgTierSubError> {
  console.log('[handleStartSubscription] called', {
    organizationId,
    targetTier,
    userId: userProfile.id,
  });

  if (targetTier !== 'launch') {
    console.log('[handleStartSubscription] targetTier is not launch');
    return {
      success: false,
      message: `Should be moving from temp to launch tier`,
      data: null,
    };
  }

  // Fetch current subscription first
  const { data: currentSubs, error: fetchError } = await supabase
    .from('organization_subscriptions')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(1);

  if (fetchError) {
    console.error('[handleStartSubscription] error fetching subscription', fetchError);
    return {
      success: false,
      message: fetchError.message || 'Failed to fetch current subscription.',
      data: null,
    };
  }

  if (!currentSubs || currentSubs.length === 0) {
    console.warn('[handleStartSubscription] no subscription found for org', organizationId);
    return {
      success: false,
      message: 'No active subscription found to update.',
      data: null,
    };
  }

  const now = new Date().toISOString();
  console.log('[handleStartSubscription] current subscription', currentSubs[0]);
  console.log('[handleStartSubscription] now timestamp', now);

  // Attempt update
  const { data: updatedData, error: updateError } = await supabase
    .from('organization_subscriptions')
    .update({
      tier: targetTier,
      start_date: now,
      current_period_start: now,
      updated_by: userProfile.id,
    })
    .eq('organization_id', organizationId)
    .limit(1)
    .select();

  if (updateError) {
    console.error('[handleStartSubscription] supabase update error', updateError);
    return {
      success: false,
      message: updateError.message || 'Failed to start subscription.',
      data: null,
    };
  }

  if (!updatedData || updatedData.length === 0) {
    console.warn('[handleStartSubscription] no subscription updated');
    return {
      success: false,
      message: 'No active subscription found to update.',
      data: null,
    };
  }

  console.log('[handleStartSubscription] subscription updated successfully');

  // Attempt to send notification but do NOT block main flow
  const { error: notifError } = await supabase.rpc('insert_org_notification', {
    p_organization_id: organizationId,
    p_type_key: 'org_subscription_started',
    p_metadata: {
      tier_name: targetTier,
      amount: 'USD 0 (FREE)',
      interval: 'Lifetime',
    },
    p_link: `${baseUrl}/${organizationId}/dashboard/subscriptions`,
    p_performed_by: userProfile.id,
  });

  if (notifError) {
    console.error('[handleStartSubscription] notification insert failed', notifError);
    return {
      success: true,
      message: `You’re now on the Launch plan! 🚀 (Notification failed to send)`,
      data: null,
      changeType: 'start',
    };
  }

  return {
    success: true,
    message: 'You’re now on the Launch plan! 🚀',
    data: null,
    changeType: 'start',
  };
}

/**
 * Creates a new Paystack subscription (used for first-time or reactivation payments)
 */
async function handleNewSubscription({
  supabase,
  organizationId,
  targetTier,
  userProfile,
  currentPeriodEnd,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
  targetTier: Tier;
  userProfile: ProfileWithSignedUrl;
  currentPeriodEnd: string | null;
}): Promise<InitializeOrgTierSubSuccess | InitializeOrgTierSubError> {
  const { data: tierRow, error: tierErr } = await supabase
    .from('tier_limits')
    .select('tier, paystack_plan_code, price_monthly_usd')
    .eq('tier', targetTier)
    .single();

  if (tierErr || !tierRow) {
    return {
      success: false,
      message: `Invalid or unavailable tier selected: ${targetTier}`,
      data: null,
    };
  }

  if (!tierRow.paystack_plan_code) {
    return {
      success: false,
      message: 'This tier is missing a Paystack plan code. Please contact support.',
      data: null,
    };
  }

  const payload = {
    organizationId,
    plan: tierRow.paystack_plan_code,
    amount: tierRow.price_monthly_usd * 100,
    tier: targetTier,
    metadata: {
      organizationId,
      targetTier,
      changeType: 'new',
      user: {
        id: userProfile.id,
        name: userProfile.full_name,
        email: userProfile.email,
      },
      currentPeriodEnd,
    },
  };

  const { data: txResponse, error: txError } =
    await supabase.functions.invoke<PaystackSubscriptionResponse>(
      'initialize-paystack-subscription-transaction',
      { body: payload },
    );

  if (txError || !txResponse?.success) {
    return { success: false, message: 'Failed to initialize payment.', data: null };
  }

  return {
    success: true,
    message: 'Subscription payment initialized successfully.',
    data: txResponse.data,
    changeType: 'new',
  };
}

// ---------------------------------------------------------------------------
// Main orchestrator function
// ---------------------------------------------------------------------------
interface InitializeOrgTierSubSuccess {
  success: true;
  message: string;
  data: PaystackSubscriptionResponse['data'] | null;
  changeType: ChangeType;
}

interface InitializeOrgTierSubError {
  success: false;
  message: string;
  data?: null;
}

export type InitializeOrganizationTierSubscriptionResult =
  | InitializeOrgTierSubSuccess
  | InitializeOrgTierSubError;

/**
 * Entry point: Initializes a subscription change for an organization.
 * Handles permission checks, determines change type, and delegates to the right handler.
 */
export const initializeOrganizationTierSubscription = async ({
  supabase,
  supabaseAdmin,
  data,
}: {
  supabaseAdmin: TypedSupabaseClient;
  supabase: TypedSupabaseClient;
  data: OrganizationTierChangeSchemaTypes;
}): Promise<InitializeOrganizationTierSubscriptionResult> => {
  try {
    const { tier: targetTier, organizationId, baseUrl } = data;

    // 1️⃣ Auth check
    const userProfileResp = await getUserProfile(supabase);
    if (!userProfileResp?.user) {
      return { success: false, message: 'Please log in to manage subscriptions.', data: null };
    }
    const userProfile = userProfileResp.user;

    // 2️⃣ Permission check
    const role = await getUserOrgRole({ supabase, organizationId });
    if (!role || role !== 'owner') {
      return {
        success: false,
        message: 'You do not have permission to manage this organization’s subscription.',
        data: null,
      };
    }

    // 3️⃣ Fetch current subscription
    const { data: currentSub } = await supabase
      .from('organization_subscriptions')
      .select(
        `
          tier,
          status,
          current_period_end,
          next_tier,
          downgrade_requested_at,
          tier_limits:tier_limits!organization_subscriptions_tier_fkey (*),
          next_tier_limits:tier_limits!organization_subscriptions_next_tier_fkey (*)
        `,
      )
      .eq('organization_id', organizationId)
      .maybeSingle();

    const currentTier = (currentSub?.tier ?? null) as Tier | null;
    const currentStatus = (currentSub?.status ?? null) as SubscriptionStatus | null;
    const currentPeriodEnd = currentSub?.current_period_end ?? null;
    const scheduledNextTier = (currentSub?.next_tier ?? null) as Tier | null;
    const downgradeRequestedAt = currentSub?.downgrade_requested_at ?? null;

    // 4️⃣ Determine change type
    const changeType = determineChangeType(
      currentTier,
      currentStatus,
      targetTier as Tier,
      scheduledNextTier,
      downgradeRequestedAt,
    );

    // 5️⃣ Handle each change type
    switch (changeType) {
      case 'start':
        return await handleStartSubscription({
          supabase,
          organizationId,
          targetTier: targetTier as Tier,
          userProfile,
          baseUrl,
        });

      case 'same':
        return {
          success: false,
          message:
            currentStatus === 'attention'
              ? 'Your subscription has a payment issue. Please resolve it first.'
              : 'You are already on this tier.',
          data: null,
        };

      case 'new':
        return await handleNewSubscription({
          supabase,
          organizationId,
          targetTier: targetTier as Tier,
          userProfile,
          currentPeriodEnd,
        });

      case 'upgrade':
        return await handleUpgrade({ supabase, organizationId, targetTier: targetTier as Tier });

      case 'downgrade':
        return await handleDowngrade({
          supabase,
          organizationId,
          targetTier: targetTier as Tier,
          currentTier: currentTier!,
          currentStatus,
          currentPeriodEnd,
          userId: userProfile.id,
        });

      case 'reactivation': {
        // Reactivation may come from scheduled downgrade or cancelled/completed subscription
        const cancelScheduled = Boolean(scheduledNextTier && currentStatus === 'non-renewing');

        return await handleReactivation({
          supabaseAdmin,
          organizationId,
          currentTier: currentTier!,
          targetTier: targetTier as Tier,
          userId: userProfile.id,
          cancelScheduledDowngrade: cancelScheduled,
        });
      }
    }

    return {
      success: true,
      message: `Subscription ${changeType} flow initiated successfully.`,
      data: null,
      changeType,
    };
  } catch (err) {
    console.error('[initializeOrganizationTierSubscription] Unexpected error:', err);
    return {
      success: false,
      message: 'Unexpected error occurred. Please try again later.',
      data: null,
    };
  }
};
