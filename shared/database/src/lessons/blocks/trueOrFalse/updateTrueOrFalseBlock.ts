import type { TrueOrFalseContentSchemaType } from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';
import type { ApiResponse } from '../../../types';

interface UpdateTrueOrFalseBlockParams {
  supabase: TypedSupabaseClient;
  blockId: string;
  blockData: TrueOrFalseContentSchemaType;
}

export const updateTrueOrFalseBlock = async ({
  supabase,
  blockId,
  blockData,
}: UpdateTrueOrFalseBlockParams): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  try {
    const { error } = await supabase
      .from('blocks')
      .update({
        content: { ...blockData },
        updated_by: userId,
      })
      .eq('id', blockId);

    if (error) {
      return {
        success: false,
        message: 'Failed to update the block. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Block updated successfully.',
    };
  } catch (err) {
    console.error('Error updating True or False block:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
