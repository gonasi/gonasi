import type { NewCourseTitleSchemaTypes } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const createNewCourseTitle = async ({
  supabase,
  data,
}: {
  supabase: TypedSupabaseClient;
  data: NewCourseTitleSchemaTypes;
}): Promise<ApiResponse<{ id: string }>> => {
  const { name, organizationId } = data;

  const userId = await getUserId(supabase);

  if (!userId) {
    return {
      success: false,
      message: 'User not authenticated.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        name,
        created_by: userId,
        updated_by: userId,
        organization_id: organizationId,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Supabase insert error:', error);
      return {
        success: false,
        message: error.message || 'Couldn’t add the course title.',
      };
    }

    return { success: true, message: 'Course title added successfully!', data };
  } catch (err) {
    console.error('Unexpected error in createNewCourseTitle:', err);
    return {
      success: false,
      message: 'Something went wrong—try again in a bit.',
    };
  }
};
