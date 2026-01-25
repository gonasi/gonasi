import type { TypedSupabaseClient } from '../client';

interface FetchPublishedCourseByIdArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
}

export async function fetchPublishedCourseById({
  supabase,
  courseId,
}: FetchPublishedCourseByIdArgs) {
  try {
    const { data, error } = await supabase
      .from('published_courses')
      .select('id, organization_id, name, has_free_tier, pricing_tiers')
      .eq('id', courseId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('[fetchPublishedCourseById] Supabase error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[fetchPublishedCourseById] Unexpected error:', err);
    return null;
  }
}
