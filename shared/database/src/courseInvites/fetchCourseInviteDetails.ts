import type { TypedSupabaseClient } from '../client';
import { generateSignedOrgProfileUrl, generateSignedThumbnailUrl } from '../utils';

interface CourseInviteDetails {
  courseName: string;
  description: string;
  imageUrl: string | null;
  publishedAt: string | null;
  categoryName: string | null;
  subCategoryName: string | null;
  organizationName: string;
  organizationAvatarUrl: string | null;
}

/**
 * Fetches detailed course information for a course invite page
 * Uses admin client to bypass RLS (unenrolled users can't view course details)
 * Signs Cloudinary URLs for image display
 */
export async function fetchCourseInviteDetails(
  supabase: TypedSupabaseClient,
  publishedCourseId: string,
): Promise<CourseInviteDetails | null> {
  const { data, error } = await supabase
    .from('published_courses')
    .select(
      `
      name,
      description,
      image_url,
      published_at,
      updated_at,
      course_categories (name),
      course_sub_categories (name),
      organizations (
        name,
        avatar_url
      )
    `,
    )
    .eq('id', publishedCourseId)
    .single();

  if (error) {
    console.error('[fetchCourseInviteDetails] Error fetching course details:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Use updated_at for cache busting (changes on every republish)
  // Fall back to published_at if updated_at is not available
  const timestampToUse = data.updated_at ?? data.published_at;
  const version = timestampToUse ? new Date(timestampToUse).getTime() : Date.now();

  // Generate signed Cloudinary URLs for images
  const signedImageUrl = data.image_url
    ? generateSignedThumbnailUrl({
        imagePath: data.image_url,
        version,
      })
    : null;

  const signedAvatarUrl = await generateSignedOrgProfileUrl({
    supabase,
    imagePath: data.organizations?.avatar_url ?? '',
    version,
  });

  return {
    courseName: data.name,
    description: data.description,
    imageUrl: signedImageUrl,
    publishedAt: data.published_at,
    categoryName: data.course_categories?.name || null,
    subCategoryName: data.course_sub_categories?.name || null,
    organizationName: data.organizations?.name || 'Unknown Organization',
    organizationAvatarUrl: signedAvatarUrl,
  };
}
