import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';
import { assignUserToCohort } from './assignUserToCohort';

/**
 * Removes a user from their current cohort by setting cohort_id to null.
 * This is an alias for assignUserToCohort(supabase, enrollmentId, null).
 *
 * @param supabase - The Supabase client instance
 * @param enrollmentId - The ID of the enrollment to remove from cohort
 * @returns A promise that resolves to an API response
 *
 * @example
 * ```ts
 * const result = await removeUserFromCohort(supabase, "enrollment-uuid");
 * ```
 */
export async function removeUserFromCohort(
  supabase: TypedSupabaseClient,
  enrollmentId: string,
): Promise<ApiResponse<void>> {
  return assignUserToCohort(supabase, enrollmentId, null);
}
