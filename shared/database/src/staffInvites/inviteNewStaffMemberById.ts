import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Invites a new staff member to a company by email.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} companyId - The ID of the company to which the staff member is being invited.
 * @param {string} inviteEmail - The email address of the person being invited.
 * @returns {Promise<ApiResponse>} A promise that resolves with the API response.
 */
export const inviteNewStaffMemberById = async (
  supabase: TypedSupabaseClient,
  companyId: string,
  inviteEmail: string,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const functionsUrl = `${process.env.SUPABASE_URL}/functions/v1`;

  // Prevent inviting oneself
  const { data: userProfile, error: userProfileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (userProfileError || !userProfile) {
    return { success: false, message: 'Failed to retrieve user profile.' };
  }

  if (userProfile.email === inviteEmail) {
    return { success: false, message: 'You cannot invite yourself.' };
  }

  try {
    // Verify if the inviter has the necessary permissions
    const { data: staffData, error: staffError } = await supabase
      .from('staff_members')
      .select(
        ` 
        id,
        staff_id,
        company_id,
        staff_role,
        company_profile:profiles!staff_members_company_id_fkey(id, username, email, full_name, phone_number)
      `,
      )
      .match({ staff_id: userId, company_id: companyId })
      .single();

    if (staffError || !staffData) {
      return { success: false, message: 'Company not found or access denied.' };
    }

    if (staffData.staff_role === 'user') {
      return {
        success: false,
        message: 'You do not have permission to invite team members.',
      };
    }

    // check if email has already been invited
    const { data: invitedUser } = await supabase
      .from('staff_invites')
      .select('id')
      .match({ invited_email: inviteEmail, company_id: companyId })
      .single();

    if (invitedUser) {
      return {
        success: false,
        message: 'This email has already been invited.',
      };
    }

    // Set expiration date for the invitation (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const inviteData = {
      staff_id: null,
      company_id: companyId,
      invite_token: crypto.randomUUID(),
      invited_email: inviteEmail,
      invited_by: userId,
      expires_at: expiresAt.toISOString(),
    };

    // Insert the invitation into the staff_invites table
    const { data: insertData, error: insertError } = await supabase
      .from('staff_invites')
      .insert(inviteData)
      .select('id, invite_token')
      .single();

    if (insertError || !insertData) {
      console.error('Supabase insert error:', insertError);
      return { success: false, message: insertError.message || 'Failed to send invitation.' };
    }

    // Call Supabase Edge Function to send the email
    const res = await fetch(`${functionsUrl}/send-invite-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        to: inviteEmail,
        inviteToken: insertData.invite_token,
        companyName: staffData.company_profile.full_name,
      }),
    });

    const responseJson = await res.json();
    if (!res.ok) {
      console.error('Edge Function error:', responseJson);
      return { success: false, message: 'Failed to send invitation email.' };
    }

    return { success: true, message: 'Staff member invited successfully.' };
  } catch (err) {
    console.error('Unexpected error in inviteNewStaffMemberById:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
