import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

export interface EnrollmentStatus {
  enrollment_id: string | null;
  is_enrolled: boolean;
  is_active: boolean;
  expires_at: string | null;
  days_remaining: number | null;
  latest_activity_id: string | null;
}

interface GetEnrollmentStatusArgs {
  supabase: TypedSupabaseClient;
  publishedCourseId: string;
}

export const getEnrollmentStatus = async ({
  supabase,
  publishedCourseId,
}: GetEnrollmentStatusArgs): Promise<EnrollmentStatus | null> => {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase.rpc('get_enrollment_status', {
    p_user_id: userId,
    p_published_course_id: publishedCourseId,
  });

  if (error) {
    console.error('Failed to get enrollment status:', error);
    return null;
  }

  return (data?.[0] ?? null) as EnrollmentStatus;
};
