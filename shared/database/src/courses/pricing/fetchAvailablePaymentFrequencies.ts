import type { TypedSupabaseClient } from '../../client';

interface FetchAvailablePaymentFrequenciesParams {
  supabase: TypedSupabaseClient;
  courseId: string;
}

/**
 * Retrieves unused payment frequency tiers for a specific course
 * via the Supabase RPC function `get_available_payment_frequencies`.
 *
 * @param params.supabase - The Supabase client instance
 * @param params.courseId - The unique identifier of the course
 * @returns A list of available payment frequencies, or null on error
 */
export async function fetchAvailablePaymentFrequencies({
  supabase,
  courseId,
}: FetchAvailablePaymentFrequenciesParams) {
  const { data, error } = await supabase.rpc('get_available_payment_frequencies', {
    p_course_id: courseId,
  });

  if (error || !data) {
    console.error(
      'Failed to fetch available payment frequencies:',
      error?.message || 'No data returned',
    );
    return null;
  }

  return data;
}
