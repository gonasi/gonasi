import type { TypedSupabaseClient } from '../../../client';

/**
 * Checks if the provided handle is already taken by another organization.
 * Allows the current organization to reuse its existing handle.
 */
export const checkHandleExists = async ({
  supabase,
  organizationId,
  handle,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
  handle: string;
}): Promise<boolean> => {
  try {
    // Fetch the current organization's handle
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('handle')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Failed to fetch current organization:', orgError);
      return false; // or throw if preferred
    }

    // Allow reuse if it's the same handle
    if (org?.handle === handle) {
      return false;
    }

    // Check if any other organization already uses this handle
    const { data: existing, error: handleError } = await supabase
      .from('organizations')
      .select('id')
      .eq('handle', handle)
      .single();

    if (handleError && handleError.code !== 'PGRST116') {
      // 'PGRST116' = no rows found (PostgREST's 404)
      console.error('Failed to check handle existence:', handleError);
      return false;
    }

    return Boolean(existing); // true if handle exists, false otherwise
  } catch (err) {
    console.error('Unexpected error during handle check:', err);
    return false;
  }
};
