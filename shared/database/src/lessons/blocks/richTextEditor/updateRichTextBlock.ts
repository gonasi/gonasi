import type { RichTextContentSchemaType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';

interface UpdateRichTextBlockParams {
  supabase: TypedSupabaseClient;
  blockId: string;
  blockData: RichTextContentSchemaType;
}

export const updateRichTextBlock = async ({
  supabase,
  blockId,
  blockData,
}: UpdateRichTextBlockParams): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { content } = blockData;

  try {
    const { error } = await supabase
      .from('blocks')
      .update({
        content,
        updated_by: userId,
      })
      .eq('id', blockId);

    if (error) {
      return {
        success: false,
        message: 'Unable to update block. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Block updated successfully.',
    };
  } catch (err) {
    console.error('Unexpected error in updateRichTextBlock:', err);
    return {
      success: false,
      message: 'Unexpected error occurred. Please try again later.',
    };
  }
};
