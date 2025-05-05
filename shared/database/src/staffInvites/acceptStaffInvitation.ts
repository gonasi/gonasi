import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Accepts a staff invitation using the provided token.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} inviteToken - The invitation token to accept.
 * @returns {Promise<ApiResponse>} A promise that resolves with the API response.
 */
export const acceptStaffInvitation = async (
  supabase: TypedSupabaseClient,
  inviteToken: string,
): Promise<ApiResponse> => {
  try {
    // Get the current authenticated user's ID
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: 'Authentication required.' };
    }

    const userId = user.id;

    // Get the current user's profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return { success: false, message: 'Failed to retrieve user profile.' };
    }

    // Find the invitation with the given token
    const { data: invitation, error: inviteError } = await supabase
      .from('staff_invites')
      .select('*')
      .eq('invite_token', inviteToken)
      .single();

    if (inviteError || !invitation) {
      return { success: false, message: 'Invalid or expired invitation token.' };
    }

    // Check if the invitation has already been confirmed
    if (invitation.is_confirmed) {
      return { success: false, message: 'This invitation has already been accepted.' };
    }

    // Check if the invitation has expired
    const now = new Date();
    const expiryDate = new Date(invitation.expires_at);

    if (expiryDate < now) {
      return {
        success: false,
        message: 'This invitation has expired. Please request a new invitation.',
      };
    }

    // Verify the invitation is for the current user
    if (invitation.staff_id && invitation.staff_id !== userId) {
      return { success: false, message: 'This invitation was not issued for your account.' };
    }

    if (invitation.invited_email && invitation.invited_email !== userProfile.email) {
      return {
        success: false,
        message: 'This invitation was issued for a different email address.',
      };
    }

    // Begin a transaction to ensure data consistency
    const { error: transactionError } = await supabase.rpc('accept_staff_invitation', {
      p_user_id: userId,
      p_invite_id: invitation.id,
      p_company_id: invitation.company_id,
    });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return {
        success: false,
        message: 'Failed to accept invitation. You may already be a member of this company.',
      };
    }

    // Get company details for the response
    const { data: company, error: companyError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', invitation.company_id)
      .single();

    if (companyError || !company) {
      return {
        success: true,
        message: 'You have successfully joined the company.',
      };
    }

    return {
      success: true,
      message: `You have successfully joined ${company.full_name}.`,
    };
  } catch (err) {
    console.error('Unexpected error in acceptStaffInvitation:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
};
