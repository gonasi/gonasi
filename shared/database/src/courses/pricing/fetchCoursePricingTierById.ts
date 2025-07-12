import type { TypedSupabaseClient } from '../../client';

interface FetchCoursePricingParams {
  supabase: TypedSupabaseClient;
  coursePricingId: string;
}

/**
 * Fetches a single course pricing tier by its ID.
 *
 * @param supabase - A typed Supabase client instance.
 * @param coursePricingId - The ID of the course pricing tier to retrieve.
 * @returns The course pricing tier data or null if not found or an error occurred.
 */
export async function fetchCoursePricingTierById({
  supabase,
  coursePricingId,
}: FetchCoursePricingParams) {
  const { data, error } = await supabase
    .from('course_pricing_tiers')
    .select(
      `
      id,
      course_id,
      organization_id,
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
    .eq('id', coursePricingId)
    .single(); // Ensures only one record is returned

  if (error || !data) {
    console.error('Failed to fetch course pricing:', error?.message || 'No data returned');
    return null;
  }

  return data;
}
