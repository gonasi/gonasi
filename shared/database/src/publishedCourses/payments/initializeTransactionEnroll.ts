import { v4 as uuidv4 } from 'uuid';

import type { InitializeEnrollTransactionSchemaTypes } from '@gonasi/schemas/payments';
import { PricingSchema } from '@gonasi/schemas/publish';

import type { TypedSupabaseClient } from '../../client';
import { getUserProfile } from '../../profile';
import type { ApiResponse } from '../../types';
import {
  type InitializeEnrollTransactionResponse,
  InitializeEnrollTransactionResponseSchema,
} from './types';

/**
 * Initializes a transaction for enrolling in a course.
 * Validates user, course, and pricing tier before triggering the payment flow.
 */
export const initializeTransactionEnroll = async (
  supabase: TypedSupabaseClient,
  initData: InitializeEnrollTransactionSchemaTypes,
): Promise<ApiResponse<InitializeEnrollTransactionResponse>> => {
  try {
    const { courseId, pricingTierId } = initData;

    const userProfile = await getUserProfile(supabase);
    if (!userProfile?.user) {
      console.error('[initializeTransactionEnroll] No authenticated user found.');
      return {
        success: false,
        message: 'User not authenticated. Please log in and try again.',
      };
    }

    // Fetch course with pricing data
    const { data: course, error: courseFetchError } = await supabase
      .from('published_courses')
      .select('id, pricing_data')
      .eq('id', courseId)
      .single();

    if (courseFetchError || !course) {
      console.error(
        '[initializeTransactionEnroll] Failed to fetch course:',
        courseFetchError?.message ?? 'Course not found.',
      );
      return {
        success: false,
        message: 'Course not found or is currently unavailable.',
      };
    }

    // Validate pricing data format
    const pricingValidation = PricingSchema.safeParse(course.pricing_data);
    if (!pricingValidation.success) {
      console.error(
        '[initializeTransactionEnroll] Pricing data validation failed:',
        pricingValidation.error,
      );
      return {
        success: false,
        message: 'Invalid course pricing data. Please contact support.',
      };
    }

    // Locate the selected pricing tier
    const selectedTier = pricingValidation.data.find((tier) => tier.id === pricingTierId);
    if (!selectedTier) {
      console.error('[initializeTransactionEnroll] Pricing tier not found:', pricingTierId);
      return {
        success: false,
        message: 'Selected pricing option is not available.',
      };
    }

    // Determine final amount, using promotional price if still valid
    const hasValidPromotion =
      selectedTier.promotional_price != null &&
      (!selectedTier.promotion_end_date || new Date(selectedTier.promotion_end_date) > new Date());

    const finalAmount =
      (hasValidPromotion ? selectedTier.promotional_price! : selectedTier.price) * 100;

    // Invoke payment transaction function
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
        message: 'Unable to start payment transaction. Please try again later.',
      };
    }

    // Validate response structure using Zod
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
        message: 'Invalid response from payment service. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Enrollment transaction started successfully.',
      data: parsedTransaction.data,
    };
  } catch (err) {
    console.error(
      '[initializeTransactionEnroll] Unexpected error during transaction initialization:',
      err,
    );
    return {
      success: false,
      message: 'Something went wrong. Please try again later.',
    };
  }
};
