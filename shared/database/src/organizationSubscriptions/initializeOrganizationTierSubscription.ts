import type { OrganizationTierChangeSchemaTypes } from '@gonasi/schemas/subscriptions';

import type { TypedSupabaseClient } from '../client';
import { getUserOrgRole } from '../organizations/getUserOrgRole';
import { getUserProfile } from '../profile';
import type { PaystackSubscriptionResponse } from './organizationSubscriptionsTypes';

interface InitializeOrgTierSubSuccess {
  success: true;
  message: string;
  data: PaystackSubscriptionResponse['data'];
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

    const userProfile = await getUserProfile(supabase);
    if (!userProfile?.user) {
      return {
        success: false,
        message: 'You need to be logged in to manage this subscription.',
        data: null,
      };
    }

    //
    // 1. Permission check
    //
    const role = await getUserOrgRole({ supabase, organizationId });

    if (!role || role === 'editor') {
      return {
        success: false,
        message: 'You do not have permission to manage this organization’s subscription.',
        data: null,
      };
    }

    //
    // 2. Fetch tier row (includes Paystack plan code)
    //
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

    //
    // 3. Initialize the Paystack subscription (typesafe)
    //
    const payload = {
      organizationId,
      plan: tierRow.paystack_plan_code,
      amount: tierRow.price_monthly_usd * 100, // Convert to kobo or cents
      tier: targetTier,
      metadata: {
        organizationId,
        targetTier,
        user: {
          id: userProfile.user.id,
          name: userProfile.user.full_name,
          email: userProfile.user.email,
        },
      },
    };

    const { data: txResponse, error: txError } =
      await supabase.functions.invoke<PaystackSubscriptionResponse>(
        'initialize-paystack-subscription-transaction',
        {
          body: payload,
        },
      );
    console.log('txResponse, ', txResponse);
    // console.error('********************* txError, ', txError);

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
