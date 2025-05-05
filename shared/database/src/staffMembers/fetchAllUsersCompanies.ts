import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface DataItem {
  id: string;
  staff_id: string;
  company_id: string;
  profiles: Profile;
}

interface ResultItem {
  profile: Profile;
  is_selected: boolean;
}

function getProfilesWithSelection(activeCompanyId: string, data: DataItem[]): ResultItem[] {
  return data.map(({ company_id, profiles }) => ({
    profile: profiles,
    is_selected: company_id === activeCompanyId,
  }));
}

interface ActiveCompany {
  company_id: string;
}

/**
 * Fetches all companies associated with the current user (staff member),
 * ordered by `created_at` in descending order.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @returns {Promise<ResultItem[]>} A promise resolving to an array of profiles with selection status.
 */
export async function fetchAllUsersCompanies(supabase: TypedSupabaseClient): Promise<ResultItem[]> {
  const staffId = await getUserId(supabase); // staffId is same as userId in this case

  const { data: activeCompany, error: activeCompanyError } = await supabase
    .from('user_active_companies')
    .select('company_id')
    .eq('user_id', staffId)
    .single<ActiveCompany>();

  if (activeCompanyError) {
    console.error('Error fetching active company:', activeCompanyError);
  }

  const { data, error } = await supabase
    .from('staff_members')
    .select(
      `id, staff_id, company_id, profiles!staff_members_company_id_fkey (id, username, full_name, avatar_url)`,
    )
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false })
    .overrideTypes<DataItem[], { merge: false }>(); // ✅ Use the new recommended method

  if (error) {
    console.error('Error fetching staff members:', error);
    return [];
  }

  return getProfilesWithSelection(activeCompany?.company_id ?? '', data ?? []);
}
