import type { TypedSupabaseClient } from '../../client';

interface GetNextBlockPositionArgs {
  supabase: TypedSupabaseClient;
  lessonId: string;
}

export const getNextBlockPosition = async ({
  supabase,
  lessonId,
}: GetNextBlockPositionArgs): Promise<number> => {
  const { data: maxPositionResult, error: positionError } = await supabase
    .from('blocks')
    .select('position')
    .eq('lesson_id', lessonId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  if (positionError && positionError.code !== 'PGRST116') {
    throw new Error('Failed to fetch the current max position for blocks.');
  }

  return maxPositionResult?.position != null ? maxPositionResult.position + 1 : 0;
};
