import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

export const getUserOrgRole = async ({
  supabase,
  organizationId,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
}): Promise<'owner' | 'admin' | 'editor' | null> => {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase.rpc('get_user_org_role', {
    arg_org_id: organizationId,
    arg_user_id: userId,
  });

  if (error) {
    console.error('Error fetching user org role:', error);
    return null;
  }

  if (!data) return null;

  // Enforce expected enum type
  if (['owner', 'admin', 'editor'].includes(data)) {
    return data as 'owner' | 'admin' | 'editor';
  }

  return null;
};
