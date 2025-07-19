import type { RichTextSchemaTypes } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';

/**
 * Upserts (inserts or updates) a rich text block in the database.
 *
 * If `blockId` is `'create-new'`, it omits the ID from the payload to allow Supabase to auto-generate one.
 * This is important during initial creation from routes where no existing ID is available.
 *
 * @param supabase - The typed Supabase client instance
 * @param blockData - The rich text block data to be saved
 * @returns ApiResponse indicating success or failure
 */
export const upsertRichTextBlock = async (
  supabase: TypedSupabaseClient,
  blockData: RichTextSchemaTypes,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { id, content, organization_id, lesson_id, course_id, plugin_type, settings } = blockData;

  try {
    const { error } = await supabase.from('lesson_blocks').upsert({
      id: id === 'create-new' ? undefined : id,
      lesson_id,
      course_id,
      organization_id,
      plugin_type,
      content,
      settings,
      created_by: userId,
      updated_by: userId,
    });

    if (error) {
      return {
        success: false,
        message: 'Failed to create the new rich text block. Please try again.',
      };
    }

    return {
      success: true,
      message:
        id === 'create-new'
          ? 'Rich text block created successfully.'
          : 'Rich text block successfully updated',
    };
  } catch (err) {
    console.error('Unexpected error in upsertRichTextBlock:', err);
    return {
      success: false,
      message:
        'An unexpected error occurred while creating the rich text block. Please try again later.',
    };
  }
};
