import { ObjectSchema, PricingSchema, ValidateChaptersSchema } from '@gonasi/schemas/publish';

import type { TypedSupabaseClient } from '../client';

interface FetchPublishedCourseByIdParams {
  supabase: TypedSupabaseClient;
  publishedCourseId: string;
}

/**
 * Fetches a published course by ID and validates its structured fields.
 *
 * @param supabase - The Supabase client instance.
 * @param publishedCourseId - The ID of the published course to fetch.
 * @returns The validated course data or null if an error or parsing issue occurs.
 */
export async function fetchPublishedCourseById({
  supabase,
  publishedCourseId,
}: FetchPublishedCourseByIdParams) {
  const { data, error } = await supabase
    .from('published_courses')
    .select(
      `
      id,
      published_at,
      version,
      name,
      description,
      image_url,
      blur_hash,
      course_categories,
      course_sub_categories,
      pathways,
      pricing_data,
      course_chapters,
      lessons_with_blocks,
      chapters_count,
      lessons_count,
      created_by,
      created_at,
      updated_at
    `,
    )
    .eq('id', publishedCourseId)
    .single();

  if (error) {
    console.error('[fetchPublishedCourseById] Supabase fetch error:', error.message);
    return null;
  }

  if (!data) {
    console.warn('[fetchPublishedCourseById] No course data found.');
    return null;
  }

  const pricingResult = PricingSchema.safeParse(data.pricing_data);
  const categoriesResult = ObjectSchema.safeParse(data.course_categories);
  const subCategoriesResult = ObjectSchema.safeParse(data.course_sub_categories);
  const pathwaysResult = ObjectSchema.safeParse(data.pathways);
  const courseChaptersResult = ValidateChaptersSchema.safeParse(data.course_chapters);

  if (!pricingResult.success) {
    console.error('[fetchPublishedCourseById] Invalid pricing_data:', pricingResult.error);
    return null;
  }

  if (!categoriesResult.success) {
    console.error('[fetchPublishedCourseById] Invalid course_categories:', categoriesResult.error);
    return null;
  }

  if (!subCategoriesResult.success) {
    console.error(
      '[fetchPublishedCourseById] Invalid course_sub_categories:',
      subCategoriesResult.error,
    );
    return null;
  }

  if (!pathwaysResult.success) {
    console.error('[fetchPublishedCourseById] Invalid pathways:', pathwaysResult.error);
    return null;
  }

  if (!courseChaptersResult.success) {
    console.error(
      '[fetchPublishedCourseById] Invalid courseChaptersResult:',
      courseChaptersResult.error,
    );
    return null;
  }

  return {
    ...data,
    pricing_data: pricingResult.data,
    course_categories: categoriesResult.data,
    course_sub_categories: subCategoriesResult.data,
    pathways: pathwaysResult.data,
    course_chapters: courseChaptersResult.data,
  };
}
