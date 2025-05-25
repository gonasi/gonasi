import type {
  MultipleChoiceSingleAnswerSettingsSchemaType,
  SubmitMultipleChoiceSingleAnswerSettingsSchemaType,
} from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';

interface EditMultipleChoiceSingleAnswerBlockSettingsArgs {
  supabase: TypedSupabaseClient;
  data: SubmitMultipleChoiceSingleAnswerSettingsSchemaType;
}

export const editMultipleChoiceSingleAnswerSettings = async ({
  supabase,
  data,
}: EditMultipleChoiceSingleAnswerBlockSettingsArgs) => {
  try {
    const userId = await getUserId(supabase);
    const { blockId, playbackMode, layoutStyle, randomization, weight } = data;

    const settings: MultipleChoiceSingleAnswerSettingsSchemaType = {
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
      console.error('Error updating Multiple Choice (Single Answer) block settings:', error);
      return {
        success: false,
        message:
          'Could not update Multiple Choice (Single Answer) block settings. Please try again.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Multiple Choice (Single Answer) block settings updated successfully.',
    };
  } catch (err) {
    console.error(
      'Unexpected error while updating Multiple Choice (Single Answer) block settings:',
      err,
    );
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      data: null,
    };
  }
};
