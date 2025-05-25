import type {
  MultipleChoiceMultipleAnswersSettingsSchemaType,
  SubmitMultipleChoiceMultipleAnswersSettingsSchemaType,
} from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';

interface EditMultipleChoiceMultipleAnswersBlockSettingsArgs {
  supabase: TypedSupabaseClient;
  data: SubmitMultipleChoiceMultipleAnswersSettingsSchemaType;
}

export const editMultipleChoiceMultipleAnswersSettings = async ({
  supabase,
  data,
}: EditMultipleChoiceMultipleAnswersBlockSettingsArgs) => {
  try {
    const userId = await getUserId(supabase);
    const { blockId, playbackMode, layoutStyle, randomization, weight } = data;

    const settings: MultipleChoiceMultipleAnswersSettingsSchemaType = {
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
      console.error('Error updating Multiple Choice (Multiple Answers) block settings:', error);
      return {
        success: false,
        message:
          'Could not update the Multiple Choice (Multiple Answers) block settings. Please try again.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Multiple Choice (Multiple Answers) block settings updated successfully.',
    };
  } catch (err) {
    console.error(
      'Unexpected error while updating Multiple Choice (Multiple Answers) block settings:',
      err,
    );
    return {
      success: false,
      message:
        'An unexpected error occurred while updating the block settings. Please try again later.',
      data: null,
    };
  }
};
