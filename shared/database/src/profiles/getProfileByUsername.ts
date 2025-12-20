import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { generateSignedUserProfilePictureUrl } from '../utils';

interface GetProfileByUsernameParams {
  supabase: TypedSupabaseClient;
  username: string;
}

export const getProfileByUsername = async ({ supabase, username }: GetProfileByUsernameParams) => {
  const userId = await getUserId(supabase);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, blur_hash, updated_at')
    .eq('username', username)
    .single();

  if (error || !profile?.username) {
    return null;
  }

  const version = profile.updated_at ? new Date(profile.updated_at).getTime() : undefined;

  const signedUrl = await generateSignedUserProfilePictureUrl({
    supabase,
    imagePath: profile.avatar_url ?? '',
    version,
  });

  return {
    user: {
      ...profile,
      signed_url: signedUrl ?? '', // Ensure it's always a string
      isMyProfile: userId === profile.id,
    },
  };
};
