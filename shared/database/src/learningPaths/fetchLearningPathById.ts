import { isGoSuOrGoAdminOrGoStaff } from '@gonasi/utils/roleFunctions';

import { getUserId, getUserRole } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { COURSES_BUCKET, LEARNING_PATHWAYS_BUCKET } from '../constants';

export async function fetchLearningPathById(supabase: TypedSupabaseClient, id: string) {
  const userId = await getUserId(supabase);
  const userRole = await getUserRole(supabase);
  const canViewAll = isGoSuOrGoAdminOrGoStaff(userRole);

  const query = supabase
    .from('pathways')
    .select('*, courses(*)')
    .match(canViewAll ? { id } : { id, created_by: userId })
    .single();

  const { data, error } = await query;

  if (error || !data) {
    console.error('Error fetching learning paths:', error?.message || 'Learning path not found');
    return null;
  }

  // Generate signed URL for the learning path image
  let signedUrl = '';
  if (data.image_url) {
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(LEARNING_PATHWAYS_BUCKET)
      .createSignedUrl(data.image_url, 3600);

    if (urlError) {
      console.error('Error creating signed URL for pathway image:', urlError.message);
    } else {
      signedUrl = signedUrlData.signedUrl;
    }
  }

  // Generate signed URLs for course images
  const coursesWithSignedUrls = await Promise.all(
    data.courses.map(async (course) => {
      let courseSignedUrl = '';
      if (course.image_url) {
        const { data: courseSignedUrlData, error: courseUrlError } = await supabase.storage
          .from(COURSES_BUCKET)
          .createSignedUrl(course.image_url, 3600);

        if (courseUrlError) {
          console.error('Error creating signed URL for course image:', courseUrlError.message);
        } else {
          courseSignedUrl = courseSignedUrlData.signedUrl;
        }
      }
      return { ...course, signed_url: courseSignedUrl };
    }),
  );

  return { ...data, signed_url: signedUrl, courses: coursesWithSignedUrls };
}
