import type z from 'zod';

import { PricingSchema } from '@gonasi/schemas/publish/course-pricing';
import {
  type PublishedCourseDetails,
  PublishedCourseDetailsSchema,
} from '@gonasi/schemas/publish/published-course-details';

import type { TypedSupabaseClient } from '../client';
import { PUBLISHED_THUMBNAILS } from '../constants';

/**
 * Helper to define query structure for fetching published course details.
 */
const defineCourseQuery = (supabase: TypedSupabaseClient) =>
  supabase.from('published_courses').select(`
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
    total_reviews,
    course_structure
  `);

// Infer type from query
type RawCourseRow = NonNullable<Awaited<ReturnType<typeof defineCourseQuery>>['data']>[0];

/**
 * Creates a signed URL for a published course thumbnail.
 */
async function generateSignedThumbnailUrl(
  supabase: TypedSupabaseClient,
  imagePath: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(PUBLISHED_THUMBNAILS)
      .createSignedUrl(imagePath, 3600);

    if (error) {
      console.error(`[generateSignedThumbnailUrl] Failed for ${imagePath}:`, error.message);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error(`[generateSignedThumbnailUrl] Unexpected error for ${imagePath}:`, error);
    return null;
  }
}

/**
 * Safely parses a stringified JSON field into a usable object.
 */
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

/**
 * Transforms and validates a raw course DB row into a typed `PublishedCourseDetails` object.
 */
async function transformAndValidateCourse(
  rawCourse: RawCourseRow,
  supabase: TypedSupabaseClient,
): Promise<z.infer<typeof PublishedCourseDetailsSchema> | null> {
  try {
    const parsedPricingTiers = parseJsonField(rawCourse.pricing_tiers);
    const pricingResult = PricingSchema.safeParse(parsedPricingTiers);

    if (!pricingResult.success) {
      console.error(
        `[transformCourse] Invalid pricing_tiers for course ${rawCourse.id}:`,
        pricingResult.error.message,
      );
      return null;
    }

    const parsedStructure = parseJsonField(rawCourse.course_structure);
    if (!parsedStructure) {
      console.error(`[transformCourse] Invalid course_structure for course ${rawCourse.id}`);
      return null;
    }

    const thumbnailUrl = await generateSignedThumbnailUrl(supabase, rawCourse.image_url);
    if (!thumbnailUrl) {
      console.error(`[transformCourse] Failed to generate thumbnail URL for ${rawCourse.id}`);
      return null;
    }

    // Construct transformed object
    const validatedCourse = {
      ...rawCourse,
      pricing_tiers: pricingResult.data,
      course_structure: parsedStructure,
      signed_url: thumbnailUrl,
      published_at: (() => {
        try {
          const date = new Date(rawCourse.published_at);
          if (isNaN(date.getTime())) throw new Error('Invalid date');
          return date.toISOString();
        } catch (error) {
          console.error(
            `[transformCourse] Invalid published_at for ${rawCourse.id}:`,
            rawCourse.published_at,
          );
          throw error;
        }
      })(),
    };

    // Validate final object against schema
    const finalValidation = PublishedCourseDetailsSchema.safeParse(validatedCourse);
    if (!finalValidation.success) {
      console.error(
        `[transformCourse] Course ${rawCourse.id} failed schema validation:`,
        finalValidation.error.errors,
      );
      return null;
    }

    return finalValidation.data;
  } catch (error) {
    console.error(`[transformCourse] Unexpected error processing course ${rawCourse.id}:`, error);
    return null;
  }
}

interface FetchPublishedPublicCourseByIdArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
}

/**
 * Fetches and transforms a publicly published course by ID.
 */
export async function fetchPublishedPublicCourseById({
  supabase,
  courseId,
}: FetchPublishedPublicCourseByIdArgs): Promise<PublishedCourseDetails | null> {
  try {
    const { data: courseRow, error } = await supabase
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
        total_reviews,
        course_structure
      `,
      )
      .eq('id', courseId)
      .eq('visibility', 'public')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('[fetchPublishedCourseById] Error fetching course:', error.message);
      return null;
    }

    if (!courseRow) {
      console.warn(`[fetchPublishedCourseById] Course ${courseId} not found`);
      return null;
    }

    return await transformAndValidateCourse(courseRow as RawCourseRow, supabase);
  } catch (error) {
    console.error(`[fetchPublishedCourseById] Unexpected error for ${courseId}:`, error);
    return null;
  }
}
