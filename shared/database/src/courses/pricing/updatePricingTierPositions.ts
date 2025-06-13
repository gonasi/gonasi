import type { CourseTierPositionUpdateArrayType } from '@gonasi/schemas/coursePricing';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface UpdatePricingTierPositionsParams {
  supabase: TypedSupabaseClient;
  courseId: string;
  pricingTierPositions: CourseTierPositionUpdateArrayType;
}

export async function updatePricingTierPositions({
  supabase,
  courseId,
  pricingTierPositions,
}: UpdatePricingTierPositionsParams) {
  const userId = await getUserId(supabase);

  try {
    const { error } = await supabase.rpc('reorder_pricing_tiers', {
      p_course_id: courseId,
      tier_positions: pricingTierPositions,
      p_updated_by: userId,
    });

    if (error) {
      console.error('Error calling reorder_pricing_tiers:', error);
      return {
        success: false,
        message: 'Could not update pricing tier order. Please try again.',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error during reorder:', err);
    return {
      success: false,
      message: 'Something went wrong while reordering pricing tiers.',
    };
  }
}
