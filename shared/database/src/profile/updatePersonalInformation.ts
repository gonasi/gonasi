import type { UpdatePersonalInformationSchemaTypes } from '@gonasi/schemas/settings';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Updates the currently signed-in user's profile with new personal info.
 */
export const updatePersonalInformation = async (
  supabase: TypedSupabaseClient,
  updates: UpdatePersonalInformationSchemaTypes,
) => {
  const id = await getUserId(supabase);
  const { fullName, username } = updates;

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      full_name: fullName,
    })
    .eq('id', id)
    .select(); // Ensure updated data is returned

  if (error) {
    console.error(`[updatePersonalInformation]`, { error });
    return {
      success: false,
      message: 'Hmm... something went wrong while updating your info.',
    };
  }

  return {
    success: true,
    message: 'All set! Your personal info has been updated.',
  };
};
