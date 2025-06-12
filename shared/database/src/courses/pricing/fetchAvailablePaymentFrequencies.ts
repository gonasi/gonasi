import type { TypedSupabaseClient } from '../../client';

interface FetchAvailablePaymentFrequenciesParams {
  supabase: TypedSupabaseClient;
  courseId: string;
}

const frequencyLabels = {
  monthly: 'Monthly – billed every month',
  bi_monthly: 'Bi Monthly – billed every 2 months',
  quarterly: 'Quarterly – billed every 3 months',
  semi_annual: 'Semi Annual – billed twice a year',
  annual: 'Annual – billed once a year',
} as const;

type FrequencyValue = keyof typeof frequencyLabels;

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
}: FetchAvailablePaymentFrequenciesParams): Promise<{ label: string; value: string }[] | null> {
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

  return data.map((value: string) => ({
    value,
    label: frequencyLabels[value as FrequencyValue] ?? value,
  }));
}
