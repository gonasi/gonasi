import type { InviteMemberToOrganizationSchemaTypes } from '@gonasi/schemas/organizations';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

export const inviteOrganizationMember = async (
  supabase: TypedSupabaseClient,
  formData: InviteMemberToOrganizationSchemaTypes,
) => {
  try {
    const userId = await getUserId(supabase);
    const { organizationId, email, role } = formData;

    // Safely cast role to the expected literal union
    const validRoles = [
      'owner',
      'admin',
      'editor',
      'instructor',
      'analyst',
      'support',
      'collaborator',
      'ai_collaborator',
    ] as const;

    if (!validRoles.includes(role as any)) {
      return {
        success: false,
        message: 'Invalid role provided.',
        data: null,
      };
    }

    const { data, error } = await supabase.from('organization_invites').insert({
      organization_id: organizationId,
      email,
      role: role as (typeof validRoles)[number],
      invited_by: userId,
      token: 'sometoken', // Replace with real token generation
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    });

    if (error) {
      console.error('[inviteOrganizationMember]', error);

      return {
        success: false,
        message: 'Failed to send invite. You may have reached your plan’s limit.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Invitation sent successfully.',
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
