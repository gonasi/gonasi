import type z from 'zod';

import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';
import {
  type PaginatedPublishedCourses,
  PaginatedPublishedCoursesSchema,
  PublishedCourseSchema,
} from '@gonasi/schemas/publish/published-course';

import type { TypedSupabaseClient } from '../client';
import { PUBLISHED_THUMBNAILS } from '../constants';
import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';

// Create a helper function to infer the exact query result type
const createQueryTypeHelper = (supabase: TypedSupabaseClient) =>
  supabase.from('published_courses').select(
    `
      id,
      organization_id,
      category_id,
      subcategory_id,
      name,
      description,
      image_url,
      blur_hash,
      visibility,
      is_active,
      pricing_tiers,
      published_at,
      published_by,
      total_chapters,
      total_lessons,
      total_blocks,
      has_free_tier,
      min_price,
      total_enrollments,
      active_enrollments,
      completion_rate,
      average_rating,
      total_reviews
    `,
    { count: 'exact' },
  );

// Infer the database row type from the actual query
type DatabaseCourseRow = NonNullable<Awaited<ReturnType<typeof createQueryTypeHelper>>['data']>[0];

async function createPublishedThumbnailSignedUrl(
  supabase: TypedSupabaseClient,
  imageUrl: string,
): Promise<string | null> {
  try {
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(PUBLISHED_THUMBNAILS)
      .createSignedUrl(imageUrl, 3600);

    if (signedUrlError) {
      console.error(
        `[createSignedUrl] Failed to create signed URL for ${imageUrl}:`,
        signedUrlError.message,
      );
      return null;
    }

    return signedUrlData?.signedUrl || null;
  } catch (err) {
    console.error(`[createSignedUrl] Unexpected error for ${imageUrl}:`, err);
    return null;
  }
}

function parseJsonField<T>(field: T | string): T | null {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return null;
    }
  }
  return field;
}

async function processCourse(
  course: DatabaseCourseRow,
  supabase: TypedSupabaseClient,
): Promise<z.infer<typeof PublishedCourseSchema> | null> {
  try {
    // Parse and validate pricing_tiers JSON field
    const rawPricingTiers = parseJsonField(course.pricing_tiers);

    const pricingValidation = PricingSchema.safeParse(rawPricingTiers);
    if (!pricingValidation.success) {
      console.error(
        `[processCourse] Invalid pricing_tiers for course ${course.id}:`,
        pricingValidation.error.message,
      );
      return null;
    }

    // Create signed URL - required by schema
    const signed_url = await createPublishedThumbnailSignedUrl(supabase, course.image_url);
    if (!signed_url) {
      console.error(`[processCourse] Failed to create signed URL for course ${course.id}`);
      return null;
    }

    // Construct the course object with proper date formatting
    const processedCourse = {
      ...course,
      pricing_tiers: pricingValidation.data,
      signed_url,
      // Ensure published_at is in proper ISO datetime format
      published_at: (() => {
        try {
          const date = new Date(course.published_at);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }
          return date.toISOString();
        } catch (err) {
          console.error(
            `[processCourse] Invalid published_at for course ${course.id}:`,
            course.published_at,
          );
          throw err;
        }
      })(),
    };

    // Validate the entire object against the schema
    const validation = PublishedCourseSchema.safeParse(processedCourse);
    if (!validation.success) {
      console.error(
        `[processCourse] Course ${course.id} failed schema validation:`,
        validation.error.errors,
      );
      return null;
    }

    return validation.data;
  } catch (err) {
    console.error(`[processCourse] Unexpected error processing course ${course.id}:`, err);
    return null;
  }
}

export async function fetchPublishedPublicCourses({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
}: FetchDataParams): Promise<PaginatedPublishedCourses> {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  let query = supabase
    .from('published_courses')
    .select(
      `
      id,
      organization_id,
      category_id,
      subcategory_id,
      name,
      description,
      image_url,
      blur_hash,
      visibility,
      is_active,
      pricing_tiers,
      published_at,
      published_by,
      total_chapters,
      total_lessons,
      total_blocks,
      has_free_tier,
      min_price,
      total_enrollments,
      active_enrollments,
      completion_rate,
      average_rating,
      total_reviews
    `,
      { count: 'exact' },
    )
    .eq('visibility', 'public')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .range(startIndex, endIndex);

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data: courses, error, count } = await query;

  if (error) {
    console.error('[fetchPublishedPublicCourses] Error fetching courses:', error.message);
    const result = { count: 0, data: [] };
    return PaginatedPublishedCoursesSchema.parse(result);
  }

  if (!courses?.length) {
    const result = { count: count || 0, data: [] };
    return PaginatedPublishedCoursesSchema.parse(result);
  }

  // Process courses with proper typing
  const processedCourses = await Promise.all(
    courses.map((course) => processCourse(course as DatabaseCourseRow, supabase)),
  );

  // Filter out null values - these are courses that failed processing/validation
  const validCourses = processedCourses.filter(
    (course): course is NonNullable<typeof course> => course !== null,
  );

  // Construct and validate the final result
  const result = {
    count: count || 0,
    data: validCourses,
  };

  // Final validation to ensure type safety
  return PaginatedPublishedCoursesSchema.parse(result);
}
