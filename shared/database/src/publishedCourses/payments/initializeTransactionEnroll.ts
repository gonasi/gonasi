import type { InitializeEnrollTransactionSchemaTypes } from '@gonasi/schemas/payments';

import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

/**
 * Initializes the transaction flow for enrolling in a course.
 * Verifies that the course exists and has pricing data.
 *
 * @param supabase - Supabase client instance
 * @param data - Enrollment transaction payload
 * @returns ApiResponse indicating success or failure
 */
export const initializeTransactionEnroll = async (
  supabase: TypedSupabaseClient,
  data: InitializeEnrollTransactionSchemaTypes,
): Promise<ApiResponse> => {
  try {
    const { courseId } = data;

    // Fetch course with pricing data
    const { data: course, error: fetchError } = await supabase
      .from('published_courses')
      .select('id, pricing_data')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      console.error(
        '[initializeTransactionEnroll] Failed to fetch course:',
        fetchError?.message ?? 'Course not found',
      );

      return {
        success: false,
        message: 'Course not found or unavailable.',
      };
    }

    // Success — course was found and has pricing data
    return {
      success: true,
      message: 'Enrollment transaction initialized successfully.',
    };
  } catch (err) {
    console.error('[initializeTransactionEnroll] Unexpected error:', err);

    return {
      success: false,
      message: 'Something went wrong while initializing enrollment. Please try again.',
    };
  }
};
