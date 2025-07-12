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
 * Starts the enrollment process for a course by:
 * - Verifying the user is logged in
 * - Validating the course and selected pricing tier
 * - Calculating the correct amount (factoring in promotions)
 * - Initializing a payment transaction if needed
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

    // Fetch the published course and its pricing info
    const { data: course, error: courseFetchError } = await supabase
      .from('published_courses')
      .select('id, pricing_tiers')
      .match({ id: courseId, organization_id: organizationId })
      .single();

    if (courseFetchError || !course) {
      console.error(
        '[initializeTransactionEnroll] Failed to fetch course:',
        courseFetchError?.message ?? 'Course not found.',
      );
      return {
        success: false,
        message: 'Sorry, we couldn’t find the course or it’s no longer available.',
      };
    }

    // Ensure pricing data is valid
    const rawTiers =
      typeof course.pricing_tiers === 'string'
        ? JSON.parse(course.pricing_tiers)
        : course.pricing_tiers;

    const pricingValidation = PricingSchema.safeParse(rawTiers);

    if (!pricingValidation.success) {
      console.error(
        '[initializeTransactionEnroll] Pricing data validation failed:',
        pricingValidation.error,
      );
      return {
        success: false,
        message: 'There’s an issue with this course’s pricing. Please contact support.',
      };
    }

    // Locate the selected tier
    const selectedTier = pricingValidation.data.find((tier) => tier.id === pricingTierId);

    if (!selectedTier) {
      console.error('[initializeTransactionEnroll] Pricing tier not found:', pricingTierId);
      return {
        success: false,
        message: 'That pricing option is no longer available. Please try another one.',
      };
    }

    // Check if there's a valid promotion
    const hasValidPromotion =
      selectedTier.promotional_price != null &&
      (!selectedTier.promotion_end_date || new Date(selectedTier.promotion_end_date) > new Date());

    const finalAmount =
      (hasValidPromotion ? selectedTier.promotional_price! : selectedTier.price) * 100;

    // Skip payment flow if it's a free tier
    if (finalAmount === 0) {
      // TODO: Go ahead and enroll user
      return {
        success: true,
        message: 'You’ve successfully enrolled in the course!',
        data: {
          status: true,
          message: 'You’ve successfully enrolled in the course!',
          data: {
            authorization_url: '',
            access_code: '',
            reference: '',
          },
        },
      };
    }

    // Create payment transaction via Supabase Function
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
        '[initializeTransactionEnroll] Failed to initialize payment transaction:',
        transactionError,
      );
      return {
        success: false,
        message: 'We couldn’t start the payment process. Please try again shortly.',
      };
    }

    // Validate transaction response format
    const parsedTransaction = InitializeEnrollTransactionResponseSchema.safeParse(
      transactionData.data,
    );

    if (!parsedTransaction.success) {
      console.error(
        '[initializeTransactionEnroll] Transaction response validation failed:',
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
    console.error(
      '[initializeTransactionEnroll] Unexpected error during transaction initialization:',
      err,
    );
    return {
      success: false,
      message: 'Oops! Something went wrong. Please try again later.',
    };
  }
};
