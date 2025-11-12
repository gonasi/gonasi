import type { OrganizationTierChangeSchemaTypes } from '@gonasi/schemas/subscriptions';

import type { TypedSupabaseClient } from '../client';
import { getUserOrgRole } from '../organizations/getUserOrgRole';
import type { ProfileWithSignedUrl } from '../profile';
import { getUserProfile } from '../profile';
import type { Database } from '../schema';
import type { PaystackSubscriptionResponse } from './organizationSubscriptionsTypes';
import type { TierLimitsRow } from './validateTierChangeRequest';
import { VALID_TIER_ORDER } from './validateTierChangeRequest';

const VALID_UPGRADE_TIER_ORDER: TierLimitsRow[] = ['scale', 'impact', 'enterprise'];

type Tier = (typeof VALID_UPGRADE_TIER_ORDER)[number];
type ChangeType = 'upgrade' | 'downgrade' | 'reactivation' | 'new' | 'same';
type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

const determineChangeType = (
  currentTier: Tier | null,
  currentStatus: SubscriptionStatus | null,
  targetTier: Tier,
): ChangeType => {
  // NOTE: Always check 'launch' or it will go to upgrade flow
  if (!currentTier || currentTier === 'launch') return 'new';

  // Payment issues block changes
  if (currentStatus === 'attention') return 'same';

  // Reactivation for cancelled, completed, or non-renewing
  if (
    currentStatus === 'cancelled' ||
    currentStatus === 'completed' ||
    currentStatus === 'non-renewing'
  ) {
    return 'reactivation';
  }

  // Compare tier order
  const currentIndex = VALID_TIER_ORDER.indexOf(currentTier);
  const targetIndex = VALID_TIER_ORDER.indexOf(targetTier);

  if (targetIndex > currentIndex) return 'upgrade';
  if (targetIndex < currentIndex) return 'downgrade';
  return 'same';
};

// -------------------------
// Dummy placeholders
// -------------------------
async function handleUpgrade({
  supabase,
  organizationId,
  targetTier,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
  targetTier: Tier;
}): Promise<InitializeOrgTierSubSuccess | InitializeOrgTierSubError> {
  console.log('🚀 Upgrade logic', {
    organizationId,
    targetTier,
  });

  const payload = {
    organizationId,
    targetTier,
  };

  const { data: txResponse, error: txError } =
    await supabase.functions.invoke<PaystackSubscriptionResponse>(
      'initialize-paystack-subscription-upgrade-transaction',
      { body: payload },
    );

  if (txError || !txResponse || !txResponse.success) {
    return {
      success: false,
      message: 'Failed to initialize upgrade payment. Please try again.',
      data: null,
    };
  }

  return {
    success: true,
    message: 'Upgrade payment initialized successfully.',
    data: txResponse.data,
    changeType: 'upgrade',
  };
}

async function handleDowngrade({
  supabase,
  organizationId,
  targetTier,
  currentTier,
  currentStatus,
  currentPeriodEnd,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
  targetTier: Tier;
  currentTier: Tier;
  currentStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
}) {
  console.log('⚠️ Downgrade logic placeholder', {
    organizationId,
    targetTier,
    currentTier,
    currentStatus,
    currentPeriodEnd,
  });
  // TODO: schedule downgrade at period end
}

async function handleReactivation({
  supabase,
  organizationId,
  targetTier,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
  targetTier: Tier;
}) {
  console.log('🔁 Reactivation logic placeholder', { organizationId, targetTier });
  // TODO: reactivate cancelled, completed, or non-renewing subscription
}

// -------------------------
// New subscription handler
// -------------------------
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

  if (txError || !txResponse || !txResponse.success) {
    return {
      success: false,
      message: 'Failed to initialize payment. Please try again.',
      data: null,
    };
  }

  return {
    success: true,
    message: 'Subscription payment initialized successfully.',
    data: txResponse.data,
    changeType: 'new',
  };
}

// -------------------------
// Main function
// -------------------------
interface InitializeOrgTierSubSuccess {
  success: true;
  message: string;
  data: PaystackSubscriptionResponse['data'];
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

export const initializeOrganizationTierSubscription = async ({
  supabase,
  data,
}: {
  supabase: TypedSupabaseClient;
  data: OrganizationTierChangeSchemaTypes;
}): Promise<InitializeOrganizationTierSubscriptionResult> => {
  try {
    const { tier: targetTier, organizationId } = data;

    // 1️⃣ Auth check
    const userProfileResp = await getUserProfile(supabase);
    if (!userProfileResp?.user) {
      return {
        success: false,
        message: 'You need to be logged in to manage this subscription.',
        data: null,
      };
    }
    const userProfile = userProfileResp.user;

    // 2️⃣ Permission check
    const role = await getUserOrgRole({ supabase, organizationId });
    if (!role || role === 'editor') {
      return {
        success: false,
        message: 'You do not have permission to manage this organization’s subscription.',
        data: null,
      };
    }

    // 3️⃣ Fetch current subscription
    const { data: currentSub } = await supabase
      .from('organization_subscriptions')
      .select('tier, status, current_period_end')
      .eq('organization_id', organizationId)
      .maybeSingle();

    const currentTier = (currentSub?.tier ?? null) as Tier | null;
    const currentStatus = (currentSub?.status ?? null) as SubscriptionStatus | null;
    const currentPeriodEnd = currentSub?.current_period_end ?? null;

    if (targetTier === 'launch') {
      return {
        success: false,
        message:
          'You cannot switch to the Launch (free) tier directly. Please unsubscribe instead.',
        data: null,
      };
    }

    // 🚫 Prevent switching to the same tier
    if (currentTier && targetTier === currentTier) {
      return {
        success: false,
        message: 'You are already on this tier.',
        data: null,
      };
    }

    // 4️⃣ Determine change type
    const changeType = determineChangeType(currentTier, currentStatus, targetTier as Tier);

    // 5️⃣ Handle each change type
    switch (changeType) {
      case 'same': {
        if (currentStatus === 'attention') {
          return {
            success: false,
            message:
              'Your subscription has a payment issue. Please resolve it before changing tiers.',
            data: null,
          };
        }
        return {
          success: false,
          message: 'You are already on this tier.',
          data: null,
        };
      }

      case 'new': {
        return await handleNewSubscription({
          supabase,
          organizationId,
          targetTier: targetTier as Tier,
          userProfile,
          currentPeriodEnd,
        });
      }

      case 'upgrade': {
        return await handleUpgrade({
          supabase,
          organizationId,
          targetTier: targetTier as Tier,
        });
      }

      case 'downgrade': {
        await handleDowngrade({
          supabase,
          organizationId,
          targetTier: targetTier as Tier,
          currentTier: currentTier!,
          currentStatus,
          currentPeriodEnd,
        });
        break;
      }

      case 'reactivation': {
        await handleReactivation({
          supabase,
          organizationId,
          targetTier: targetTier as Tier,
        });
        break;
      }
    }

    // ✅ Placeholder response for non-new flows
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
