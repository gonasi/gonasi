import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Resends an invitation email to a staff member.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} inviteId - The ID of the invitation to resend.
 * @returns {Promise<ApiResponse>} A promise that resolves with the API response.
 */
export const resendStaffInvitation = async (
  supabase: TypedSupabaseClient,
  inviteId: string,
  companyId: string,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const functionsUrl = `${process.env.SUPABASE_URL}/functions/v1`;

  try {
    // Get the invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('staff_invites')
      .select(
        `
        id,
        staff_id,
        company_id,
        invite_token,
        invited_email,
        invited_by,
        expires_at,
        is_confirmed,
        last_resent_at,
        resend_count
      `,
      )
      .match({ id: inviteId, company_id: companyId })
      .single();

    if (inviteError || !invitation) {
      return { success: false, message: 'Invitation not found.' };
    }

    // Check if the invitation has already been confirmed
    if (invitation.is_confirmed) {
      return { success: false, message: 'This invitation has already been accepted.' };
    }

    // Verify if the user has permission to resend the invitation
    const { data: staffData, error: staffError } = await supabase
      .from('staff_members')
      .select(
        `
        id,
        staff_id,
        company_id,
        staff_role,
        company_profile:profiles!staff_members_company_id_fkey(id, username, email, full_name)
      `,
      )
      .match({ staff_id: userId, company_id: invitation.company_id })
      .single();

    if (staffError || !staffData) {
      return { success: false, message: 'Company not found or access denied.' };
    }

    // Check if the user has permission to resend invites
    if (staffData.staff_role === 'user') {
      return {
        success: false,
        message: 'You do not have permission to resend invitations.',
      };
    }

    // Check if the invitation has expired and regenerate if needed
    const now = new Date();

    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 7);
    const newToken = crypto.randomUUID();

    // Rate limiting: Allow only 3 resends per day
    const lastResent = invitation.last_resent_at ? new Date(invitation.last_resent_at) : null;
    const twentyFourHoursAgo = new Date(now);
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    if (lastResent && lastResent >= twentyFourHoursAgo && (invitation.resend_count ?? 0) >= 3) {
      return {
        success: false,
        message: 'You can only resend this invitation 3 times within 24 hours.',
      };
    }

    // Get the email address to send to
    let emailToSend = invitation.invited_email || null;

    if (!emailToSend) {
      // If no invited_email, the invite might be linked to a user profile
      if (!invitation.staff_id) {
        return { success: false, message: 'Invalid invitation: No email address found.' };
      }

      // Get the email from the user profile
      const { data: invitedUser, error: invitedUserError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', invitation.staff_id)
        .single();

      if (invitedUserError || !invitedUser || !invitedUser.email) {
        return { success: false, message: 'Failed to get invited user email.' };
      }

      emailToSend = invitedUser.email;
    }

    // Update the invitation's last resent timestamp, increment resend count, and update token if expired
    const { error: updateError } = await supabase
      .from('staff_invites')
      .update({
        last_resent_at: now.toISOString(),
        resend_count: invitation.resend_count + 1,
        invite_token: newToken,
        expires_at: newExpiryDate.toISOString(),
      })
      .eq('id', inviteId)
      .select();

    if (updateError) {
      console.error('Database update error:', updateError);
      return { success: false, message: 'Failed to update invitation details.' };
    }

    // Send the invitation email
    const res = await fetch(`${functionsUrl}/send-invite-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: emailToSend,
        inviteToken: newToken,
        companyName: staffData.company_profile.full_name,
        isResend: true,
      }),
    });

    const responseJson = await res.json();
    if (!res.ok) {
      console.error('Edge Function error:', responseJson);
      return { success: false, message: 'Failed to send invitation email.' };
    }

    return {
      success: true,
      message: 'Invitation resent successfully.',
    };
  } catch (err) {
    console.error('Unexpected error in resendStaffInvitation:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
