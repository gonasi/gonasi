import type {
  SubmitEditTapToRevealSettingsSchemaType,
  TapToRevealSettingsSchemaType,
} from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';

interface EditTapToRevealSettingsArgs {
  supabase: TypedSupabaseClient;
  data: SubmitEditTapToRevealSettingsSchemaType;
}

export const editTapToRevealSettings = async ({ supabase, data }: EditTapToRevealSettingsArgs) => {
  try {
    const userId = await getUserId(supabase);
    const { blockId, playbackMode, layoutStyle, randomization, weight } = data;

    const settings: TapToRevealSettingsSchemaType = {
      playbackMode,
      layoutStyle,
      randomization,
      weight,
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
      console.error('Error updating Tap to Reveal block settings:', error);
      return {
        success: false,
        message: 'Failed to update Tap to Reveal block settings. Please try again.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Tap to Reveal block settings updated successfully.',
    };
  } catch (err) {
    console.error('Unexpected error while updating Tap to Reveal block settings:', err);
    return {
      success: false,
      message:
        'An unexpected error occurred while updating the block settings. Please try again later.',
      data: null,
    };
  }
};
