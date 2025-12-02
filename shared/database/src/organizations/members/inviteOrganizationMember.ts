import type { Database } from '@gonasi/database/schema';
import type { InviteMemberToOrganizationSchemaTypes } from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../../client';
import { getUserProfile } from '../../profile';

type OrgRoles = Database['public']['Enums']['org_role'];

// Centralized role hierarchy (you can update only here)
const ROLE_RANK: Record<OrgRoles, number> = {
  owner: 3,
  admin: 2,
  editor: 1,
};

export const inviteOrganizationMember = async (
  supabase: TypedSupabaseClient,
  formData: InviteMemberToOrganizationSchemaTypes,
) => {
  try {
    const { user } = await getUserProfile(supabase);
    const { organizationId, email, role } = formData;

    // ✅ Validate role using enum (no hardcoded list)
    if (!(role in ROLE_RANK)) {
      return {
        success: false,
        message: 'Invalid role provided.',
        data: null,
      };
    }

    // Self-invite check
    if (email === user?.email) {
      return {
        success: false,
        message: `You can't invite yourself.`,
        data: null,
      };
    }

    // 1. Fetch user role
    const { data: orgRoleData, error: orgRoleError } = await supabase.rpc('get_user_org_role', {
      arg_org_id: organizationId,
      arg_user_id: user?.id ?? '',
    });

    if (orgRoleError || !orgRoleData) {
      console.error('[inviteOrganizationMember] Role fetch failed:', orgRoleError);
      return {
        success: false,
        message: 'Could not verify your role in the organization.',
        data: null,
      };
    }

    const userRole = orgRoleData as OrgRoles;

    // ✅ Permission check using ranked hierarchy
    const isAdminOrHigher = ROLE_RANK[userRole] >= ROLE_RANK['admin'];
    if (!isAdminOrHigher) {
      return {
        success: false,
        message: 'You must be an admin to invite members.',
        data: null,
      };
    }

    // ✅ Only owner can invite admins
    if (role === 'admin' && userRole !== 'owner') {
      return {
        success: false,
        message: 'Only owners can invite other admins.',
        data: null,
      };
    }

    // 2. Check if user already member
    const { data: isMember, error: isMemberError } = await supabase.rpc('is_user_already_member', {
      arg_org_id: organizationId,
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

    // 3. Check pending invite
    const { data: hasPending, error: hasPendingError } = await supabase.rpc('has_pending_invite', {
      arg_org_id: organizationId,
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
        message: 'This user already has a pending invite.',
        data: null,
      };
    }

    // 4. Tier/member limits
    const { data: canAccept, error: canAcceptError } = await supabase.rpc('can_accept_new_member', {
      arg_org_id: organizationId,
    });

    if (canAcceptError || !canAccept) {
      return {
        success: false,
        message: 'Your plan has reached its member limit. Upgrade to invite more users.',
        data: null,
      };
    }

    // ✅ Passed all checks — insert invite
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('organization_invites')
      .insert({
        organization_id: organizationId,
        email,
        role: role as OrgRoles,
        invited_by: user?.id ?? '',
        token,
        resend_count: 0,
        last_sent_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error('[inviteOrganizationMember] DB insert error:', error);
      return {
        success: false,
        message: 'Failed to create invite. Please try again.',
        data: null,
      };
    }

    const { error: invokeError } = await supabase.functions.invoke('send-org-invite', {
      body: { email, token },
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
