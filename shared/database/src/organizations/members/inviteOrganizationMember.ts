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
      if (error.code === '23505') {
        return {
          success: false,
          message: 'This user has already been invited and has a pending invite.',
          data: null,
        };
      }

      console.error('[inviteOrganizationMember] DB insert error:', error);
      return {
        success: false,
        message: 'Failed to send invite. You may have reached your plan’s limit.',
        data: null,
      };
    }

    // ✅ Invoke edge function via Supabase client
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
