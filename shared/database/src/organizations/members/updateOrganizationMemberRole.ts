import type { UpdateMemberRoleSchemaTypes } from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../../client';

interface UpdateOrganizationMemberRoleArgs {
  supabase: TypedSupabaseClient;
  data: UpdateMemberRoleSchemaTypes;
}

export async function updateOrganizationMemberRole({
  supabase,
  data,
}: UpdateOrganizationMemberRoleArgs) {
  const { organizationId, memberId, role } = data;

  try {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('[updateOrganizationMemberRole] Supabase error:', error.message);
      return { success: false, message: 'Failed to update member role.' };
    }

    return { success: true };
  } catch (err) {
    console.error('[updateOrganizationMemberRole] Unexpected error:', err);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
