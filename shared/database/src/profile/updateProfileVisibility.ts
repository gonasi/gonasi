import type { ToggleProfileVisibilitySchemaTypes } from '@gonasi/schemas/settings';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Toggles the public visibility of the currently signed-in user's profile.
 */
export const updateProfileVisibility = async (
  supabase: TypedSupabaseClient,
  updates: ToggleProfileVisibilitySchemaTypes,
) => {
  const userId = await getUserId(supabase);
  const { isPublic } = updates;

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_public: isPublic })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[updateProfileVisibility]', { error });
    return {
      success: false,
      message: 'Unable to update your profile visibility. Please try again.',
      data: null,
    };
  }

  return {
    success: true,
    message: isPublic
      ? 'Your profile is now visible to others.'
      : 'Your profile is now hidden from the public.',
    data,
  };
};
