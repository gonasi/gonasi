import type {
  SubmitEditTrueOrFalseSettingsSchemaType,
  TrueOrFalseSettingsSchemaType,
} from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';

interface EditTrueOrFalseBlockSettingsArgs {
  supabase: TypedSupabaseClient;
  data: SubmitEditTrueOrFalseSettingsSchemaType;
}

export const editTrueOrFalseBlockSettings = async ({
  supabase,
  data,
}: EditTrueOrFalseBlockSettingsArgs) => {
  try {
    const userId = await getUserId(supabase);
    const { blockId, playbackMode, weight, layoutStyle, randomization } = data;

    const settings: TrueOrFalseSettingsSchemaType = {
      playbackMode,
      layoutStyle,
      randomization,
      weight, // ensure weight is stored in both settings and the root block object if needed
    };

    const { error } = await supabase
      .from('blocks')
      .update({
        settings,
        weight,
        updated_by: userId,
      })
      .eq('id', blockId);

    if (error) {
      console.error('Failed to update True/False block settings:', error);
      return {
        success: false,
        message: 'Failed to update True/False block settings.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'True/False block settings updated successfully.',
    };
  } catch (err) {
    console.error('Unexpected error while updating True/False block settings:', err);
    return {
      success: false,
      message: 'An unexpected error occurred.',
      data: null,
    };
  }
};
