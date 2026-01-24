import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

type Cohort = Database['public']['Tables']['cohorts']['Row'];

/**
 * Fetches a single cohort by its ID.
 *
 * @param supabase - The Supabase client instance
 * @param cohortId - The ID of the cohort to fetch
 * @returns A promise that resolves to the cohort data, or null if not found
 *
 * @example
 * ```ts
 * const cohort = await fetchCohortById(supabase, "cohort-uuid");
 * if (cohort) {
 *   console.log("Cohort name:", cohort.name);
 * }
 * ```
 */
export async function fetchCohortById(
  supabase: TypedSupabaseClient,
  cohortId: string,
): Promise<Cohort | null> {
  const { data, error } = await supabase
    .from('cohorts')
    .select('*')
    .eq('id', cohortId)
    .single();

  if (error) {
    console.error('[fetchCohortById] Error:', error.message);
    return null;
  }

  return data;
}
