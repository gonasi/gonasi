import type {
  RichTextSettingsSchemaType,
  SubmitEditRichTextSettingsSchemaType,
} from '@gonasi/schemas/plugins';

import { getUserId } from '../../../auth';
import type { TypedSupabaseClient } from '../../../client';

interface EditRichTextBlockSettingsArgs {
  supabase: TypedSupabaseClient;
  data: SubmitEditRichTextSettingsSchemaType;
}

export const editRichTextBlockSettings = async ({
  supabase,
  data,
}: EditRichTextBlockSettingsArgs) => {
  try {
    const userId = await getUserId(supabase);
    const { playbackMode, weight, blockId } = data;

    const settings: RichTextSettingsSchemaType = {
      playbackMode,
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
      console.error('Error updating rich text block settings:', error);
      return {
        success: false,
        message: 'Unable to update rich text block settings.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Rich text block settings updated successfully.',
    };
  } catch (err) {
    console.error('Unexpected error while updating block settings:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while updating block settings.',
      data: null,
    };
  }
};
