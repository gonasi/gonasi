import { PublishBlockSchema } from '@gonasi/schemas/publish/base';

import type { TypedSupabaseClient } from '../../client';

export const fetchLessonBlocksByLessonId = async (
  supabase: TypedSupabaseClient,
  lessonId: string,
) => {
  try {
    const { data, error } = await supabase
      .from('lesson_blocks')
      .select(
        'id, lesson_id, plugin_type, organization_id, course_id, content, settings, position, updated_by',
      )
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true });

    if (error || !data) {
      return {
        success: false,
        message: 'Unable to load lesson blocks.',
        data: null,
      };
    }

    const parseResult = PublishBlockSchema.array().safeParse(data);

    if (!parseResult.success) {
      console.error('Validation failed for lesson blocks:', parseResult.error.format());
      return {
        success: false,
        message: 'Lesson blocks validation failed.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Lesson blocks retrieved successfully.',
      data: parseResult.data,
    };
  } catch (err) {
    console.error('Unexpected error in fetchLessonBlocksByLessonId:', err);
    return {
      success: false,
      message: 'Unexpected error occurred while loading lesson blocks.',
      data: null,
    };
  }
};
