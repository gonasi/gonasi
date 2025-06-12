import type { TypedSupabaseClient } from '../../client';

interface FetchCoursePricingParams {
  supabase: TypedSupabaseClient;
  courseId: string;
}

/**
 * Fetches pricing tiers for a given course.
 *
 * @param params - Object containing the Supabase client and course ID
 * @returns An array of pricing tier objects or null if an error occurs
 */
export async function fetchCoursePricing({ supabase, courseId }: FetchCoursePricingParams) {
  const { data, error } = await supabase
    .from('course_pricing_tiers')
    .select(
      `
      id,
      course_id,
      payment_frequency,
      is_free,
      price,
      currency_code,
      promotional_price,
      promotion_start_date,
      promotion_end_date,
      tier_name,
      tier_description,
      is_active,
      position,
      is_popular,
      is_recommended,
      created_at,
      updated_at,
      created_by,
      updated_by
    `,
    )
    .eq('course_id', courseId);

  if (error || !data) {
    console.error('Failed to fetch course pricing:', error?.message || 'No data returned');
    return null;
  }

  return data;
}
