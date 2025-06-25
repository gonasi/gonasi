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
