import type { TypedSupabaseClient } from '../../client';

interface CanAcceptNewOrgMemberParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export const canAcceptNewOrgMember = async ({
  supabase,
  organizationId,
}: CanAcceptNewOrgMemberParams) => {
  const { data, error } = await supabase.rpc('can_accept_new_member', {
    arg_org_id: organizationId,
  });

  if (error) {
    console.error('[canCreateOrganization] Error:', error);
    return false;
  }

  // data will be `true` or `false`
  return Boolean(data);
};
