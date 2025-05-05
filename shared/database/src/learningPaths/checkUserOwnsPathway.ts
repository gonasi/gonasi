import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Checks if the given learning path belongs to the authenticated user.
 *
 * @param supabase - The Supabase client instance.
 * @param learningPathId - The ID of the learning path.
 * @returns A boolean indicating whether the user owns the pathway.
 */
export const checkUserOwnsPathway = async (
  supabase: TypedSupabaseClient,
  learningPathId: string,
): Promise<boolean> => {
  const userId = await getUserId(supabase);

  const { data: pathwayData, error } = await supabase
    .from('pathways')
    .select('id')
    .match({ id: learningPathId, created_by: userId });

  return !error && pathwayData?.length > 0;
};
