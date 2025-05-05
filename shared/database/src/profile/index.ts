import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

export const getUserProfile = async (supabase: TypedSupabaseClient) => {
  const id = await getUserId(supabase);

  const { data } = await supabase.from('profiles').select().eq('id', id).single();

  return { user: data };
};

export const getUserCompanies = async (supabase: TypedSupabaseClient) => {
  const userId = await getUserId(supabase);

  const { data } = await supabase
    .from('staff_members')
    .select(
      `
      id,
      staff_id,
      company_id,
      company_profile:profiles!staff_members_company_id_fkey(id, username, email, full_name, phone_number)
    `,
    )
    .eq('staff_id', userId)
    .order('updated_at', { ascending: false });
  return { companies: data };
};

export const getCompanyProfileById = async (supabase: TypedSupabaseClient, companyId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .eq('id', companyId)
    .single();
  return data;
};
