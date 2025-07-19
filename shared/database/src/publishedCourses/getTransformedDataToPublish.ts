import {
  type CourseStructureContentSchemaTypes,
  type CourseStructureOverviewSchemaTypes,
  PublishBlockSchema,
} from '@gonasi/schemas/publish';
import type { PricingSchemaTypes } from '@gonasi/schemas/publish/course-pricing';

import type { TypedSupabaseClient } from '../client';

export async function getTransformedDataToPublish({
  supabase,
  courseId,
  organizationId,
}: {
  supabase: TypedSupabaseClient;
  courseId: string;
  organizationId: string;
}) {
  try {
    const { data, error } = await supabase
      .from('courses')
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
      
          chapters (
            id,
            course_id,
            name,
            description,
            position,
      
            lessons (
              id,
              course_id,
              chapter_id,
              lesson_type_id,
              name,
              position,
              settings,
      
              lesson_types (
                id,
                name,
                description,
                lucide_icon,
                bg_color
              ),
      
              lesson_blocks (
                id,
                organization_id,
                course_id,
                lesson_id,
                plugin_type,
                content,
                settings,
                position
              )
            )
          ),
      
          course_pricing_tiers (
            id,
            course_id,
            organization_id,
            payment_frequency,
            is_free,
            price,
            currency_code,
            promotional_price,
            promotion_start_date,
            promotion_end_date,
            tier_name,
            tier_description,
            is_active,
            position,
            is_popular,
            is_recommended
          )
        `,
      )
      .eq('id', courseId)
      .eq('organization_id', organizationId)
      .order('position', { referencedTable: 'chapters', ascending: true })
      .order('position', { referencedTable: 'course_pricing_tiers', ascending: true })
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Course not found');
    }

    // Sort nested data client-side
    if (data.chapters) {
      data.chapters.forEach((chapter) => {
        if (chapter.lessons) {
          // Sort lessons by position
          chapter.lessons.sort((a, b) => (a.position || 0) - (b.position || 0));

          // Sort lesson blocks by position
          chapter.lessons.forEach((lesson) => {
            if (lesson.lesson_blocks) {
              lesson.lesson_blocks.sort((a, b) => (a.position || 0) - (b.position || 0));
            }
          });
        }
      });
    }

    // Calculate totals
    const totalChapters = data.chapters?.length || 0;
    const totalLessons =
      data.chapters?.reduce((acc, chapter) => acc + (chapter.lessons?.length || 0), 0) || 0;
    const totalBlocks =
      data.chapters?.reduce(
        (acc, chapter) =>
          acc +
          (chapter.lessons?.reduce(
            (lessonAcc, lesson) => lessonAcc + (lesson.lesson_blocks?.length || 0),
            0,
          ) || 0),
        0,
      ) || 0;

    // Build course structure content (full structure with blocks)
    const courseStructureContent: CourseStructureContentSchemaTypes = {
      total_chapters: totalChapters,
      total_lessons: totalLessons,
      total_blocks: totalBlocks,
      chapters: (data.chapters ?? []).map((chapter) => ({
        id: chapter.id,
        course_id: chapter.course_id,
        name: chapter.name,
        description: chapter.description ?? '',
        position: chapter.position ?? 0,
        lesson_count: chapter.lessons?.length ?? 0,
        total_lessons: chapter.lessons?.length ?? 0,
        total_blocks:
          chapter.lessons?.reduce((acc, lesson) => acc + (lesson.lesson_blocks?.length ?? 0), 0) ??
          0,
        lessons: (chapter.lessons ?? []).map((lesson) => ({
          id: lesson.id,
          course_id: lesson.course_id,
          chapter_id: lesson.chapter_id,
          lesson_type_id: lesson.lesson_type_id,
          name: lesson.name,
          position: lesson.position ?? 0,
          settings: lesson.settings ?? {},
          total_blocks: lesson.lesson_blocks?.length ?? 0,
          lesson_types: {
            id: lesson.lesson_types.id,
            name: lesson.lesson_types.name,
            description: lesson.lesson_types.description,
            lucide_icon: lesson.lesson_types.lucide_icon,
            bg_color: lesson.lesson_types.bg_color,
          },
          blocks:
            lesson.lesson_blocks?.map((block) => {
              const parseResult = PublishBlockSchema.safeParse(block);

              if (!parseResult.success) {
                throw new Error(
                  `Invalid block for plugin_type=${block.plugin_type}: ${JSON.stringify(parseResult.error.format())}`,
                );
              }

              return parseResult.data;
            }) ?? [],
        })),
      })),
    };

    // Build course structure overview (structure without block content)
    const courseStructureOverview: CourseStructureOverviewSchemaTypes = {
      total_chapters: totalChapters,
      total_lessons: totalLessons,
      total_blocks: totalBlocks,
      chapters:
        data.chapters?.map((chapter) => ({
          id: chapter.id,
          course_id: chapter.course_id,
          name: chapter.name,
          description: chapter.description ?? '',
          position: chapter.position ?? 0,
          lesson_count: chapter.lessons?.length || 0,
          total_lessons: chapter.lessons?.length || 0,
          total_blocks:
            chapter.lessons?.reduce(
              (acc, lesson) => acc + (lesson.lesson_blocks?.length || 0),
              0,
            ) || 0,
          lessons:
            chapter.lessons?.map((lesson) => ({
              id: lesson.id,
              course_id: lesson.course_id,
              chapter_id: lesson.chapter_id,
              lesson_type_id: lesson.lesson_type_id,
              name: lesson.name,
              position: lesson.position ?? 0,
              total_blocks: lesson.lesson_blocks?.length || 0,
              lesson_types: {
                id: lesson.lesson_types.id,
                name: lesson.lesson_types.name,
                description: lesson.lesson_types.description,
                lucide_icon: lesson.lesson_types.lucide_icon,
                bg_color: lesson.lesson_types.bg_color,
              },
            })) || [],
        })) || [],
    };

    // Transform pricing tiers
    const pricingTiers: PricingSchemaTypes =
      data.course_pricing_tiers?.map((tier) => ({
        id: tier.id,
        course_id: tier.course_id,
        organization_id: tier.organization_id,
        payment_frequency: tier.payment_frequency,
        is_free: tier.is_free,
        price: tier.price,
        currency_code: tier.currency_code,
        promotional_price: tier.promotional_price,
        promotion_start_date: tier.promotion_start_date,
        promotion_end_date: tier.promotion_end_date,
        tier_name: tier.tier_name,
        tier_description: tier.tier_description,
        is_active: tier.is_active,
        position: tier.position,
        is_popular: tier.is_popular,
        is_recommended: tier.is_recommended,
      })) || [];

    // Calculate derived pricing data
    const hasFreeTier = pricingTiers.some((tier) => tier.is_free);
    const paidTiers = pricingTiers.filter((tier) => !tier.is_free);
    const minPrice = paidTiers.length > 0 ? Math.min(...paidTiers.map((tier) => tier.price)) : null;

    const transformedData = {
      id: data.id,
      organization_id: data.organization_id,
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      is_active: true,
      name: data.name,
      description: data.description || '', // Ensure non-null for published_courses
      image_url: data.image_url || '', // Ensure non-null for published_courses
      blur_hash: data.blur_hash,
      visibility: data.visibility,

      // Structure fields for published_courses
      course_structure_overview: courseStructureOverview,
      course_structure_content: courseStructureContent,
      total_chapters: totalChapters,
      total_lessons: totalLessons,
      total_blocks: totalBlocks,

      // Pricing data
      pricing_tiers: pricingTiers,
      has_free_tier: hasFreeTier,
      min_price: minPrice,

      // Default stats (will be updated by separate processes)
      total_enrollments: 0,
      active_enrollments: 0,
      completion_rate: 0.0,
      average_rating: null,
      total_reviews: 0,
    };

    return transformedData;
  } catch (error) {
    console.error('Error fetching course data:', error);
    throw error;
  }
}
