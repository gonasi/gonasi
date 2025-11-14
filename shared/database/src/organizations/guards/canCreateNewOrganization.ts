import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface CanCreateNewOrganizationParams {
  supabase: TypedSupabaseClient;
}

export const canCreateNewOrganization = async ({ supabase }: CanCreateNewOrganizationParams) => {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase.rpc('can_create_organization', {
    arg_user_id: userId,
  });

  if (error) {
    console.error('[canCreateOrganization] Error:', error);
    return false;
  }

  // data will be `true` or `false`
  return Boolean(data);
};
