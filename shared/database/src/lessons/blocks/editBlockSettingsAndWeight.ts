import type { Settings } from '@gonasi/schemas/plugins';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

export const editBlockSettingsAndWeight = async (supabase: TypedSupabaseClient, data: Settings) => {
  try {
    const userId = await getUserId(supabase);
    const { block_id, weight, settings } = data;

    const { error } = await supabase
      .from('blocks')
      .update({
        settings,
        weight,
        updated_by: userId,
      })
      .eq('id', block_id);

    if (error) {
      console.error('Failed to update block settings:', error);
      return {
        success: false,
        message: 'Failed to update block settings.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Block settings updated successfully.',
    };
  } catch (err) {
    console.error('Unexpected error in editBlockSettingsAndWeight:', err);
    return {
      success: false,
      message: 'An unexpected error occurred.',
      data: null,
    };
  }
};
