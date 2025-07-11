import { PublishCourseSchema } from '@gonasi/schemas/publish';

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

    console.log(data);

    if (error) {
      console.log('********** error: ', error);
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

    const transformedData = {
      id: data.id,
      organization_id: data.organization_id,
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      is_active: true,
      name: data.name,
      description: data.description,
      image_url: data.image_url,
      blur_hash: data.blur_hash,
      visibility: data.visibility,

      course_structure: {
        total_chapters: data.chapters?.length || 0,
        total_lessons:
          data.chapters?.reduce((acc, chapter) => acc + (chapter.lessons?.length || 0), 0) || 0,
        total_blocks:
          data.chapters?.reduce(
            (acc, chapter) =>
              acc +
              (chapter.lessons?.reduce(
                (lessonAcc, lesson) => lessonAcc + (lesson.lesson_blocks?.length || 0),
                0,
              ) || 0),
            0,
          ) || 0,

        chapters:
          data.chapters?.map((chapter) => ({
            id: chapter.id,
            course_id: chapter.course_id,
            name: chapter.name,
            description: chapter.description,
            position: chapter.position,
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
                position: lesson.position,
                settings: lesson.settings,
                total_blocks: lesson.lesson_blocks?.length || 0,

                lesson_types: {
                  id: lesson.lesson_types.id,
                  name: lesson.lesson_types.name,
                  description: lesson.lesson_types.description,
                  lucide_icon: lesson.lesson_types.lucide_icon,
                  bg_color: lesson.lesson_types.bg_color,
                },

                blocks:
                  lesson.lesson_blocks?.map((block) => ({
                    id: block.id,
                    lesson_id: block.lesson_id,
                    plugin_type: block.plugin_type,
                    content: block.content,
                    settings: block.settings,
                    position: block.position,
                  })) || [],
              })) || [],
          })) || [],
      },

      pricing_tiers:
        data.course_pricing_tiers?.map((tier) => ({
          id: tier.id,
          course_id: tier.course_id,
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
        })) || [],
    };

    return PublishCourseSchema.parse(transformedData);
  } catch (error) {
    console.error('Error fetching course data:', error);
    throw error;
  }
}
