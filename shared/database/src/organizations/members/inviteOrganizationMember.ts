import { randomUUID } from 'crypto';

import type { InviteMemberToOrganizationSchemaTypes } from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../../client';
import { getUserProfile } from '../../profile';

export const inviteOrganizationMember = async (
  supabase: TypedSupabaseClient,
  formData: InviteMemberToOrganizationSchemaTypes,
) => {
  try {
    const { user } = await getUserProfile(supabase);
    const { organizationId, email, role } = formData;

    const validRoles = ['owner', 'admin', 'editor'] as const;

    if (!validRoles.includes(role as any)) {
      return {
        success: false,
        message: 'Invalid role provided.',
        data: null,
      };
    }

    if (email === user?.email) {
      return {
        success: false,
        message: `You can't invite yourself.`,
        data: null,
      };
    }

    // 1. Check user role in org (must be admin or higher)
    const { data: orgRoleData, error: orgRoleError } = await supabase.rpc('get_user_org_role', {
      org_id: organizationId,
      user_id: user?.id ?? '',
    });

    if (orgRoleError || !orgRoleData) {
      console.error('[inviteOrganizationMember] Role fetch failed:', orgRoleError);
      return {
        success: false,
        message: 'Could not verify your role in the organization.',
        data: null,
      };
    }

    const userRole = orgRoleData as 'owner' | 'admin' | 'editor';

    const canInvite = userRole === 'admin' || userRole === 'owner';

    if (!canInvite) {
      return {
        success: false,
        message: 'You must be an admin to invite members.',
        data: null,
      };
    }

    if (role === 'admin' && userRole !== 'owner') {
      return {
        success: false,
        message: 'Only owners can invite other admins.',
        data: null,
      };
    }

    // 2. Check if already a member
    const { data: isMember, error: isMemberError } = await supabase.rpc('is_user_already_member', {
      org_id: organizationId,
      user_email: email,
    });

    if (isMemberError) {
      console.error('[inviteOrganizationMember] Membership check failed:', isMemberError);
      return {
        success: false,
        message: 'Could not verify membership status.',
        data: null,
      };
    }

    if (isMember) {
      return {
        success: false,
        message: 'This user is already a member of the organization.',
        data: null,
      };
    }

    // 3. Check for pending invites
    const { data: hasPending, error: hasPendingError } = await supabase.rpc('has_pending_invite', {
      org_id: organizationId,
      user_email: email,
    });

    if (hasPendingError) {
      console.error('[inviteOrganizationMember] Invite check failed:', hasPendingError);
      return {
        success: false,
        message: 'Could not verify invite status.',
        data: null,
      };
    }

    if (hasPending) {
      return {
        success: false,
        message: 'This user has already been invited and has a pending invite.',
        data: null,
      };
    }

    // 4. Check tier/member limits
    const { data: canAccept, error: canAcceptError } = await supabase.rpc('can_accept_new_member', {
      org_id: organizationId,
    });

    if (canAcceptError || !canAccept) {
      return {
        success: false,
        message: 'Your plan has reached its member limit. Upgrade to invite more users.',
        data: null,
      };
    }

    // ✅ Passed all checks — insert invite
    const token = randomUUID();

    const { data, error } = await supabase
      .from('organization_invites')
      .insert({
        organization_id: organizationId,
        email,
        role: role as (typeof validRoles)[number],
        invited_by: user?.id ?? '',
        token,
        resend_count: 0,
        last_sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (error) {
      console.error('[inviteOrganizationMember] DB insert error:', error);
      return {
        success: false,
        message: 'Failed to send invite. Please try again.',
        data: null,
      };
    }

    const { error: invokeError } = await supabase.functions.invoke('send-org-invite', {
      body: {
        email,
        token,
      },
    });

    if (invokeError) {
      console.error('[inviteOrganizationMember] Email send failed:', invokeError);
      return {
        success: false,
        message: 'Failed to send invite email.',
        data,
      };
    }

    return {
      success: true,
      message: 'Invitation is being sent.',
      data,
    };
  } catch (err) {
    console.error('[inviteOrganizationMember] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      data: null,
    };
  }
};
