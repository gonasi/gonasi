import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

export const getUserProfile = async (supabase: TypedSupabaseClient) => {
  const id = await getUserId(supabase);

  const { data } = await supabase.from('profiles').select('*').eq('id', id).single();

  return { user: data };
};

export const getUserProfileById = async (supabase: TypedSupabaseClient, companyId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .eq('id', companyId)
    .single();
  return data;
};

// TODO: Fix when update
export const updateUserProfile = async (
  supabase: TypedSupabaseClient,
  updates: {
    username?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    blur_hash?: string | null;
    phone_number?: string | null;
    phone_number_verified?: boolean;
    email_verified?: boolean;
    country_code?: string;
    preferred_language?: string;
    account_verified?: boolean;
    notifications_enabled?: boolean;
  },
) => {
  const id = await getUserId(supabase);

  // Add updated_at timestamp
  const updateData = {
    ...updates,
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  console.log('**************** profile update error: ', error);

  return { data, error };
};
