import type { TypedSupabaseClient } from '../../client';

export const fetchLessonBlocksByLessonId = async (
  supabase: TypedSupabaseClient,
  lessonId: string,
) => {
  try {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true });

    if (error) {
      return {
        success: false,
        message: 'Failed to fetch lesson blocks.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Blocks fetched successfully.',
      data,
    };
  } catch (err) {
    console.error('Unexpected error in getLessonBlocks:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while fetching blocks.',
      data: null,
    };
  }
};
