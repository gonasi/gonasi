import { v4 as uuidv4 } from 'uuid';

import type { InitializeEnrollTransactionSchemaTypes } from '@gonasi/schemas/payments';
import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';

import type { TypedSupabaseClient } from '../../client';
import { getUserProfile } from '../../profile';
import type { ApiResponse } from '../../types';
import { toPaystackMetadata } from './toPaystackMetadata';
import {
  type InitializeEnrollTransactionResponse,
  InitializeEnrollTransactionResponseSchema,
} from './types';

/**
 * Initializes the enrollment process for a course — handles both free and paid flows.
 *
 * Workflow:
 *  1. Verify authenticated user
 *  2. Fetch course + pricing tiers and validate pricing
 *  3. Determine effective price (check promotions)
 *  4. If free:
 *     - Call enrollment RPC directly
 *     - Return success/failure
 *  5. If paid:
 *     - Generate metadata
 *     - Call serverless function to initialize Paystack transaction
 *     - Return success/failure
 *
 * @param supabase - Supabase client instance
 * @param data - Course and pricing tier identifiers, and org context
 */
export const initializeTransactionEnroll = async ({
  supabase,
  data,
}: {
  supabase: TypedSupabaseClient;
  data: InitializeEnrollTransactionSchemaTypes;
}): Promise<ApiResponse<InitializeEnrollTransactionResponse>> => {
  try {
    const { publishedCourseId, pricingTierId, organizationId } = data;

    // Step 1: Ensure the user is authenticated
    const userProfile = await getUserProfile(supabase);
    if (!userProfile?.user) {
      console.error('[initializeTransactionEnroll] No authenticated user found.');
      return {
        success: false,
        message: 'You need to be logged in to enroll in this course.',
      };
    }

    // Step 2: Fetch published course and its pricing tiers
    const { data: course, error: courseFetchError } = await supabase
      .from('published_courses')
      .select('id, pricing_tiers')
      .match({ id: publishedCourseId, organization_id: organizationId })
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

    // Step 3: Validate pricing tiers
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

    // Step 4: Determine final pricing (check for valid promotion)
    const hasValidPromotion =
      selectedTier.promotional_price != null &&
      (!selectedTier.promotion_end_date || new Date(selectedTier.promotion_end_date) > new Date());

    const effectivePrice = hasValidPromotion ? selectedTier.promotional_price! : selectedTier.price;
    const isFree = effectivePrice === 0;
    const finalAmount = effectivePrice * 100; // Convert to kobo or cents

    // ─────────────────────────────────────────────────────
    // FREE ENROLLMENT FLOW
    // ─────────────────────────────────────────────────────
    if (isFree) {
      const { data: enrollData, error: enrollError } = await supabase.rpc(
        'enroll_user_in_published_course',
        {
          p_user_id: userProfile.user.id,
          p_published_course_id: publishedCourseId,
          p_tier_id: selectedTier.id,
          p_tier_name: selectedTier.tier_name ?? '',
          p_tier_description: selectedTier.tier_description || '',
          p_payment_frequency: selectedTier.payment_frequency || 'one_time',
          p_currency_code: selectedTier.currency_code,
          p_is_free: true,
          p_effective_price: 0,
          p_organization_id: organizationId,
          p_promotional_price: hasValidPromotion ? (selectedTier.promotional_price ?? 0) : 0,
          p_is_promotional: hasValidPromotion,
          p_created_by: userProfile.user.id,
        },
      );

      if (enrollError) {
        console.error('[initializeTransactionEnroll] Free enrollment RPC failed:', enrollError);
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

        return {
          success: true,
          message: 'You’ve successfully enrolled in the course!',
        };
      }
    }

    // ─────────────────────────────────────────────────────
    // PAID ENROLLMENT FLOW
    // ─────────────────────────────────────────────────────

    const reference = uuidv4();

    const metadata = toPaystackMetadata({
      publishedCourseId,
      pricingTierId,
      organizationId,
      userId: userProfile.user.id,
      userEmail: userProfile.user.email,
      userName: userProfile.user.full_name ?? '',
      tierName: selectedTier.tier_name ?? '',
      tierDescription: selectedTier.tier_description ?? '',
      paymentFrequency: selectedTier.payment_frequency,
      isPromotional: hasValidPromotion,
      promotionalPrice: selectedTier.promotional_price ?? null,
      effectivePrice,
    });

    const { data: transactionData, error: transactionError } = await supabase.functions.invoke(
      'initialize-paystack-transaction',
      {
        body: {
          email: userProfile.user.email,
          name: userProfile.user.full_name,
          amount: finalAmount,
          currencyCode: selectedTier.currency_code,
          reference,
          metadata,
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
