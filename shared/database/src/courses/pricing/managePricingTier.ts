import type { CoursePricingSchemaTypes } from '@gonasi/schemas/coursePricing';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

interface ManagePricingTierParams {
  supabase: TypedSupabaseClient;
  data: CoursePricingSchemaTypes;
}

/**
 * Creates or updates a course pricing tier in the database.
 * - If `pricingId` is "add-new-tier", a new record is inserted.
 * - Otherwise, an existing record is updated.
 */
export const managePricingTier = async ({
  supabase,
  data,
}: ManagePricingTierParams): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const {
    pricingId,
    courseId,
    organizationId,
    paymentFrequency,
    isFree,
    price,
    position,
    currencyCode,
    promotionalPrice,
    promotionStartDate,
    promotionEndDate,
    tierName,
    tierDescription,
    isActive,
    isPopular,
    isRecommended,
  } = data;

  try {
    // Prepare the data object for upsert with proper formatting
    const upsertData = {
      course_id: courseId,
      organization_id: organizationId,
      payment_frequency: paymentFrequency,
      is_free: isFree,
      price,
      position,
      currency_code: currencyCode,
      promotional_price: promotionalPrice,
      promotion_start_date: promotionStartDate?.toISOString() || null, // Format dates to ISO string
      promotion_end_date: promotionEndDate?.toISOString() || null,
      tier_name: tierName,
      tier_description: tierDescription,
      is_active: isActive,
      is_popular: isPopular,
      is_recommended: isRecommended,
      created_by: userId,
      updated_by: userId,
      // Include `id` only if updating an existing tier
      ...(pricingId !== 'add-new-tier' && { id: pricingId }),
    };

    // Insert or update the pricing tier in the database
    const { error } = await supabase.from('course_pricing_tiers').upsert(upsertData);

    if (error) {
      console.error('Database upsert error:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Pricing tier saved successfully.',
    };
  } catch (error) {
    console.error('Unexpected error during pricing tier save:', error);
    return {
      success: false,
      message:
        'An unexpected error occurred while saving the pricing tier. Please try again later.',
    };
  }
};
