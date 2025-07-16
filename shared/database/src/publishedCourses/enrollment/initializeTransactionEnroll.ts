import { v4 as uuidv4 } from 'uuid';

import type { InitializeEnrollTransactionSchemaTypes } from '@gonasi/schemas/payments';
import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';

import type { TypedSupabaseClient } from '../../client';
import { getUserProfile } from '../../profile';
import type { ApiResponse } from '../../types';
import {
  type InitializeEnrollMetadata,
  type InitializeEnrollTransactionResponse,
  InitializeEnrollTransactionResponseSchema,
} from './types';

/**
 * Initializes the enrollment process for a course.
 *
 * Steps:
 * 1. Ensure the user is authenticated.
 * 2. Fetch the published course and validate pricing tiers.
 * 3. Determine pricing logic (including promotional discounts).
 * 4. Attempt enrollment via Supabase RPC (RLS-secured).
 * 5. If it's a paid course, initialize a payment transaction (e.g., via Paystack).
 *
 * @param supabase - Supabase client instance
 * @param data - Course and pricing tier identifiers, and organization context
 * @returns API response with success status and next steps (e.g., payment URL)
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

    // Step 1: Authenticate the user
    const userProfile = await getUserProfile(supabase);
    if (!userProfile?.user) {
      console.error('[initializeTransactionEnroll] No authenticated user found.');
      return {
        success: false,
        message: 'You need to be logged in to enroll in this course.',
      };
    }

    // Step 2: Fetch course and its pricing tiers
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

    // Step 3: Parse and validate pricing tiers
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

    // Determine promotional pricing
    const hasValidPromotion =
      selectedTier.promotional_price != null &&
      (!selectedTier.promotion_end_date || new Date(selectedTier.promotion_end_date) > new Date());

    const effectivePrice = hasValidPromotion ? selectedTier.promotional_price! : selectedTier.price;
    const isFree = effectivePrice === 0;
    const finalAmount = effectivePrice * 100; // Convert to smallest currency unit (e.g., kobo)

    // Step 4: Enroll user via RPC
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

    // Step 5: Handle successful enrollment (free or paid)
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

      if (isFree) {
        return {
          success: true,
          message: 'You’ve successfully enrolled in the course!',
        };
      }
    }

    // Step 6: Paid course — initialize payment transaction
    const reference = uuidv4();

    const metadata: InitializeEnrollMetadata = {
      courseId,
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
    };

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
