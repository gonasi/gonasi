import type { BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface UpsertLessonBlockArgs {
  supabase: TypedSupabaseClient;
  blockData: BuilderSchemaTypes;
}

/**
 * Creates or updates a lesson block in the `lesson_blocks` table.
 * This function supports all plugin types and handles both insert and update cases.
 *
 * @param args - Object containing the Supabase client and block data.
 * @returns A success/failure response with an appropriate message.
 */
export const upsertLessonBlock = async ({ supabase, blockData }: UpsertLessonBlockArgs) => {
  const userId = await getUserId(supabase);

  const { id, content, organization_id, lesson_id, course_id, chapter_id, plugin_type, settings } =
    blockData;

  try {
    const upsertPayload = {
      id: id === 'create-new' ? undefined : id,
      organization_id,
      course_id,
      chapter_id,
      lesson_id,
      plugin_type,
      content,
      settings,
      created_by: userId,
      updated_by: userId,
    };

    const { error } = await supabase.from('lesson_blocks').upsert(upsertPayload);

    if (error) {
      console.error('[upsertLessonBlock] Supabase upsert error:', {
        error,
        payload: upsertPayload,
        userId,
      });

      return {
        success: false,
        message: 'Failed to save the block. Please try again.',
      };
    }

    return {
      success: true,
      message: id === 'create-new' ? 'Block created successfully.' : 'Block updated successfully.',
    };
  } catch (err) {
    console.error('[upsertLessonBlock] Unexpected error:', {
      error: err,
      blockData,
      userId,
    });

    return {
      success: false,
      message: 'An unexpected error occurred while saving the block. Please try again later.',
    };
  }
};
