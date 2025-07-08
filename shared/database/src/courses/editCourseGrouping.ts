import type { EditCourseGroupingSchemaTypes } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

interface EditCourseGroupingArgs {
  supabase: TypedSupabaseClient;
  data: EditCourseGroupingSchemaTypes;
}

export const editCourseGrouping = async ({
  supabase,
  data,
}: EditCourseGroupingArgs): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { courseId, category, subcategory } = data;

  try {
    const { error } = await supabase
      .from('courses')
      .update({
        category_id: category,
        subcategory_id: subcategory,
        updated_by: userId,
      })
      .match({
        id: courseId,
        created_by: userId,
      });

    if (error) {
      return {
        success: false,
        message: "Couldn't update the course grouping. Please review the inputs and try again.",
      };
    }

    return {
      success: true,
      message: 'Course grouping updated successfully!',
    };
  } catch (err) {
    console.error('Error updating course grouping:', err);
    return {
      success: false,
      message: 'Unexpected error. Please try again shortly.',
    };
  }
};
