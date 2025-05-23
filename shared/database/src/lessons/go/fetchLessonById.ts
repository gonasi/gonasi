import type { TypedSupabaseClient } from '../../client';

export async function fetchLessonById(supabase: TypedSupabaseClient, lessonId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, name')
    .eq('id', lessonId)
    .single();

  if (error || !data) {
    console.error(
      `Failed to fetch lesson with ID ${lessonId}:`,
      error?.message ?? 'Lesson not found',
    );
    return null;
  }

  return data;
}
