import type { TapToRevealContentSchemaType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';

interface UpdateTapToRevealParams {
  supabase: TypedSupabaseClient;
  blockId: string;
  content: TapToRevealContentSchemaType;
}

export const updateTapToReveal = async ({
  supabase,
  blockId,
  content,
}: UpdateTapToRevealParams): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

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
        message: 'Failed to update the Tap to Reveal block content. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Tap to Reveal block content updated successfully.',
    };
  } catch (err) {
    console.error('Error updating Tap to Reveal block content:', err);
    return {
      success: false,
      message:
        'An unexpected error occurred while updating the block content. Please try again later.',
    };
  }
};
