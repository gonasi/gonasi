import type { DeleteCoursePricingTierSchemaTypes } from '@gonasi/schemas/coursePricing';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

/**
 * Deletes a pricing tier by its ID if it was created by the specified user.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {DeleteCoursePricingTierSchemaTypes} data - The pricing tier ID and user ID for deletion.
 * @returns {Promise<ApiResponse>} The response indicating success or failure.
 */
export const deleteCoursePricingTier = async (
  supabase: TypedSupabaseClient,
  data: DeleteCoursePricingTierSchemaTypes,
) => {
  const userId = await getUserId(supabase);
  const { coursePricingTierId } = data;

  try {
    const { error } = await supabase.rpc('delete_pricing_tier', {
      p_tier_id: coursePricingTierId,
      p_deleted_by: userId,
    });

    if (error) {
      console.error(`[delete_pricing_tier]: `, error);
      return {
        success: false,
        message: error.message,
      };
    }

    return { success: true, message: 'Pricing tier successfully deleted.' };
  } catch (error) {
    console.error('Unexpected error while deleting pricing tier:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again later.' };
  }
};
