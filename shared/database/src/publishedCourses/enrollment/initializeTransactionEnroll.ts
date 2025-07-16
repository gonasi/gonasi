import { v4 as uuidv4 } from 'uuid';

import type { InitializeEnrollTransactionSchemaTypes } from '@gonasi/schemas/payments';
import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';

import type { TypedSupabaseClient } from '../../client';
import { getUserProfile } from '../../profile';
import type { ApiResponse } from '../../types';
import {
  type InitializeEnrollTransactionResponse,
  InitializeEnrollTransactionResponseSchema,
} from './types';

/**
 * Initializes the enrollment process for a course.
 */
export const initializeTransactionEnroll = async ({
  supabase,
  data,
}: {
  supabase: TypedSupabaseClient;
  data: InitializeEnrollTransactionSchemaTypes;
}): Promise<ApiResponse<InitializeEnrollTransactionResponse>> => {
  try {
    const { courseId, pricingTierId, organizationId } = data;

    const userProfile = await getUserProfile(supabase);

    if (!userProfile?.user) {
      console.error('[initializeTransactionEnroll] No authenticated user found.');
      return {
        success: false,
        message: 'You need to be logged in to enroll in this course.',
      };
    }

    // Fetch published course with pricing tiers
    const { data: course, error: courseFetchError } = await supabase
      .from('published_courses')
      .select('id, pricing_tiers')
      .match({ id: courseId, organization_id: organizationId })
      .single();

    if (courseFetchError || !course) {
      console.error(
        '[initializeTransactionEnroll] Failed to fetch course:',
        courseFetchError?.message,
      );
      return {
        success: false,
        message: "Sorry, we couldn't find the course or it's no longer available.",
      };
    }

    // Parse pricing tiers
    const rawTiers =
      typeof course.pricing_tiers === 'string'
        ? JSON.parse(course.pricing_tiers)
        : course.pricing_tiers;

    const pricingValidation = PricingSchema.safeParse(rawTiers);

    if (!pricingValidation.success) {
      console.error(
        '[initializeTransactionEnroll] Pricing validation failed:',
        pricingValidation.error,
      );
      return {
        success: false,
        message: 'There is a problem with the course pricing. Please contact support.',
      };
    }

    // Find selected tier
    const selectedTier = pricingValidation.data.find((tier) => tier.id === pricingTierId);
    if (!selectedTier) {
      console.error(
        '[initializeTransactionEnroll] Selected pricing tier not found:',
        pricingTierId,
      );
      return {
        success: false,
        message: 'That pricing option is no longer available.',
      };
    }

    // Determine promotional status and price
    const hasValidPromotion =
      selectedTier.promotional_price != null &&
      (!selectedTier.promotion_end_date || new Date(selectedTier.promotion_end_date) > new Date());

    const effectivePrice = hasValidPromotion ? selectedTier.promotional_price! : selectedTier.price;

    const isFree = effectivePrice === 0;
    const finalAmount = effectivePrice * 100; // in smallest currency unit

    // Call RPC to enroll user
    const { data: enrollData, error: enrollError } = await supabase.rpc(
      'enroll_user_in_published_course',
      {
        p_user_id: userProfile.user.id,
        p_published_course_id: courseId,
        p_tier_id: selectedTier.id,
        p_tier_name: selectedTier.tier_name ?? '',
        p_tier_description: selectedTier.tier_description || '',
        p_payment_frequency: selectedTier.payment_frequency || 'one_time',
        p_currency_code: selectedTier.currency_code,
        p_is_free: isFree,
        p_effective_price: effectivePrice ?? 0,
        p_organization_id: organizationId,
        p_promotional_price: hasValidPromotion ? (selectedTier.promotional_price ?? 0) : 0,
        p_is_promotional: hasValidPromotion,
        p_created_by: userProfile.user.id,
        ...(isFree
          ? {}
          : {
              // Fix: pass undefined instead of null for optional string fields
              p_payment_processor_id: undefined,
              p_payment_amount: effectivePrice,
              p_payment_method: undefined,
            }),
      },
    );

    if (enrollError) {
      console.error('[initializeTransactionEnroll] Enrollment RPC failed:', enrollError);
      return {
        success: false,
        message: 'Enrollment failed. Please try again later.',
      };
    }

    if (enrollData && typeof enrollData === 'object' && 'success' in enrollData) {
      if (!enrollData.success) {
        return {
          success: false,
          message:
            typeof enrollData.message === 'string'
              ? enrollData.message
              : 'Enrollment was not successful.',
        };
      }

      // Free enrollment: return immediately
      if (isFree) {
        return {
          success: true,
          message:
            typeof enrollData.message === 'string'
              ? enrollData.message
              : 'You’ve successfully enrolled in the course!',
          data: {
            status: true,
            message:
              typeof enrollData.message === 'string'
                ? enrollData.message
                : 'You’ve successfully enrolled in the course!',
            data: {
              authorization_url: '',
              access_code: '',
              reference: '',
            },
          },
        };
      }
    }

    // Paid enrollment: initialize payment
    const { data: transactionData, error: transactionError } = await supabase.functions.invoke(
      'initialize-paystack-transaction',
      {
        body: {
          email: userProfile.user.email,
          name: userProfile.user.full_name,
          amount: finalAmount,
          currencyCode: selectedTier.currency_code,
          reference: uuidv4(),
        },
      },
    );

    if (transactionError || !transactionData) {
      console.error(
        '[initializeTransactionEnroll] Payment initialization failed:',
        transactionError,
      );
      return {
        success: false,
        message: 'We couldn’t start the payment process. Please try again.',
      };
    }

    const parsedTransaction = InitializeEnrollTransactionResponseSchema.safeParse(
      transactionData.data,
    );

    if (!parsedTransaction.success) {
      console.error(
        '[initializeTransactionEnroll] Payment response validation failed:',
        parsedTransaction.error,
      );
      return {
        success: false,
        message: 'Unexpected response from payment provider. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Payment initialized successfully.',
      data: parsedTransaction.data,
    };
  } catch (err) {
    console.error('[initializeTransactionEnroll] Unexpected error:', err);
    return {
      success: false,
      message: 'Oops! Something went wrong. Please try again later.',
    };
  }
};
