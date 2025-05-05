import type { TypedSupabaseClient } from '../client';

/**
 * Fetches a staff member by their ID and company ID.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} staffId - The ID of the staff member.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object | null>} A promise that resolves to the staff member's data or null if not found.
 */
export const fetchStaffMemberById = async (
  supabase: TypedSupabaseClient,
  staffId: string,
  companyId: string,
) => {
  const { data, error } = await supabase
    .from('staff_members')
    .select(
      `
      id,
      staff_id,
      company_id,
      staff_role,  
      staff_profile:profiles!staff_members_staff_id_fkey(id, username, email, full_name, phone_number, avatar_url)
    `,
    )
    .match({ staff_id: staffId, company_id: companyId })
    .single();

  console.log(error);
  return data;
};
