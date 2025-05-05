import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';

interface FetchTeamMembersParams extends FetchDataParams {
  companyId: string;
}

export async function fetchAllUserStaffMembers({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
  companyId,
}: FetchTeamMembersParams) {
  try {
    let query = supabase
      .from('staff_members')
      .select(
        `
          id,
          staff_id,
          company_id,
          staff_role,
          created_at,
          updated_at,
          created_by,
          updated_by,
          staff_profile:profiles!staff_members_staff_id_fkey(id, username, email, full_name, phone_number, avatar_url),
          company_profile:profiles!staff_members_company_id_fkey(id, username, email, full_name, phone_number),
          created_by_profile:profiles!staff_members_created_by_fkey(id, username, email, full_name, phone_number)
        `,
        { count: 'exact' },
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Apply profile search if searchQuery is provided
    if (searchQuery) {
      // First, get matching profile IDs
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .or(
          `username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`,
        );

      if (profileError) throw profileError;

      if (profiles && profiles.length > 0) {
        // Filter staff members whose staff_id matches any of the profile IDs
        const matchingProfileIds = profiles.map((profile) => profile.id);
        query = query.in('staff_id', matchingProfileIds);
      } else {
        // No matching profiles found
        return {
          count: 0,
          data: [],
        };
      }
    }

    // Apply pagination only when search query exists, otherwise return all results
    if (searchQuery.trim()) {
      const { startIndex, endIndex } = getPaginationRange(page, limit);
      query = query.range(startIndex, endIndex);
    }

    const { error, data, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      count: count || 0,
      data: data || [],
    };
  } catch (error) {
    console.error('Unexpected error in fetchAllUserStaffMembers:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}
