import { getUserId } from '../auth';
import { getPaginationRange } from '../constants/utils';
import type { ApiResponse, FetchDataParams } from '../types';

interface FetchInvitesData extends FetchDataParams {
  companyId: string;
}

export const fetchAllStaffInvitesByCompanyId = async ({
  supabase,
  searchQuery = '',
  limit = 12,
  page = 1,
  companyId,
}: FetchInvitesData): Promise<
  ApiResponse<
    {
      id: string;
      staff_id: string | null;
      company_id: string;
      invited_email: string | null;
      invited_at: string;
      invited_by: string;
      expires_at: string;
      is_confirmed: boolean;
      confirmed_at: string | null;
      last_resent_at: string | null;
      resend_count: number;
      invited_by_profile: {
        id: string;
        username: string | null;
        avatar_url: string | null;
      };
    }[]
  >
> => {
  const userId = await getUserId(supabase);

  const { startIndex, endIndex } = getPaginationRange(page, limit);

  try {
    const { data: staffData, error: staffError } = await supabase
      .from('staff_members')
      .select('id, staff_role')
      .match({ staff_id: userId, company_id: companyId })
      .single();

    if (staffError || !staffData) {
      return { success: false, message: 'Company not found or access denied.' };
    }

    if (staffData.staff_role === 'user') {
      return {
        success: false,
        message: 'You do not have permission to view team member invites.',
      };
    }

    let query = supabase
      .from('staff_invites')
      .select(
        `
        id,
        staff_id,
        company_id,
        invited_email,  
        invited_at,
        invited_by,
        expires_at,
        is_confirmed,
        confirmed_at,
        last_resent_at,
        resend_count,
        invited_by_profile:profiles!staff_invites_invited_by_fkey(id, username, avatar_url)
      `,
        { count: 'exact' },
      )
      .order('invited_at', { ascending: false })
      .eq('company_id', companyId);

    if (searchQuery) {
      query = query.or(`invited_email.ilike.%${searchQuery}%`);
    }

    // Apply pagination range
    query = query.range(startIndex, endIndex);

    const { data: staffInvitesData, count, error } = await query;
    console.log('error: ', error);
    if (!staffInvitesData) {
      return {
        success: false,
        message: 'No data found',
      };
    }

    return {
      success: true,
      message: 'Staff member invited successfully.',
      data: staffInvitesData,
      count: staffInvitesData?.length ? count : null,
    };
  } catch (err) {
    console.error('Unexpected error in inviteNewStaffMemberById:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
