import type { TypedSupabaseClient } from '../client';

interface FetchCourseInvitesArgs {
  supabase: TypedSupabaseClient;
  publishedCourseId: string;
}

export async function fetchCourseInvites({
  supabase,
  publishedCourseId,
}: FetchCourseInvitesArgs) {
  try {
    const { data, error } = await supabase
      .from('course_invites')
      .select(
        `
        id,
        email,
        cohort_id,
        pricing_tier_id,
        delivery_status,
        accepted_at,
        accepted_by,
        token,
        revoked_at,
        created_at,
        last_sent_at,
        expires_at,
        cohorts (
          id,
          name
        ),
        course_pricing_tiers (
          id,
          tier_name,
          payment_frequency,
          price,
          currency_code,
          is_free
        )
      `,
      )
      .eq('published_course_id', publishedCourseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fetchCourseInvites] Supabase error:', error.message);
      return null;
    }

    return data ?? null;
  } catch (err) {
    console.error('[fetchCourseInvites] Unexpected error:', err);
    return null;
  }
}
