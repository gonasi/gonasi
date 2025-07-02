import {
  type VerifyAndSetActiveOrgResponse,
  VerifyAndSetActiveOrgResponseSchema,
} from '@gonasi/schemas/organizations';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

export async function verifyAndSetActiveOrganization({
  supabase,
  organizationId,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
}): Promise<VerifyAndSetActiveOrgResponse> {
  try {
    const userId = await getUserId(supabase);

    if (!userId) {
      return {
        success: false,
        message: 'Not authorized.',
        data: null,
      };
    }

    const { data, error } = await supabase.rpc('rpc_verify_and_set_active_organization', {
      organization_id_from_url: organizationId,
    });

    if (error) {
      console.error('RPC error:', error);
      return { success: false, message: 'Server error', data: null };
    }

    const parsed = VerifyAndSetActiveOrgResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error('Zod validation error:', parsed.error.format());
      return {
        success: false,
        message: 'Invalid server response format.',
        data: null,
      };
    }

    return parsed.data;
  } catch (err) {
    console.error('verifyAndSetActiveOrganization error:', err);
    return {
      success: false,
      message: 'Something went wrong. Please try again in a bit.',
      data: null,
    };
  }
}
