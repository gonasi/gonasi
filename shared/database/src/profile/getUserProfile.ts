import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Fetches the currently signed-in user's full profile info.
 */
export const getUserProfile = async (supabase: TypedSupabaseClient) => {
  // Get the current user's ID
  const id = await getUserId(supabase);

  // Query the 'profiles' table for relevant user fields
  const { data } = await supabase
    .from('profiles')
    .select(
      `
      id,
      username,
      email,
      full_name,
      avatar_url,
      blur_hash,
      phone_number,
      phone_number_verified,
      email_verified,
      is_public,
      mode,
      active_organization_id
      `,
    )
    .eq('id', id)
    .single(); // Expect exactly one match

  return { user: data };
};
