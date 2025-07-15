import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { PROFILE_PHOTOS } from '../constants';

interface GetProfileByUsernameParams {
  supabase: TypedSupabaseClient;
  username: string;
}

export const getProfileByUsername = async ({ supabase, username }: GetProfileByUsernameParams) => {
  const userId = await getUserId(supabase);

  const { data: profile, error } = await supabase
    .from('public_profiles')
    .select('id, username, full_name, avatar_url, blur_hash')
    .eq('username', username)
    .single();

  console.log('******** profile is: ', profile);

  if (error || !profile?.username) {
    return null;
  }

  let signedUrl: string | undefined;

  if (profile.avatar_url) {
    const { data: signedUrlData, error } = await supabase.storage
      .from(PROFILE_PHOTOS)
      .createSignedUrl(profile.avatar_url, 3600);

    console.log('signed error: ', error);

    signedUrl = signedUrlData?.signedUrl;
  }

  return {
    user: {
      ...profile,
      signed_url: signedUrl ?? '', // Ensure it's always a string
      isMyProfile: userId === profile.id,
    },
  };
};
