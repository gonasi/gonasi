import type { TypedSupabaseClient } from '../client';

interface FetchOrganizationAiAvailableCreditsArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export async function fetchOrganizationAiAvailableCredits({
  supabase,
  organizationId,
}: FetchOrganizationAiAvailableCreditsArgs) {
  try {
    const { data, error } = await supabase
      .from('v_organizations_ai_available_credits')
      .select(
        `
        org_id,
        total_available_credits,
        base_credits_remaining,
        purchased_credits_remaining,
        last_reset_at,
        next_reset_at
        `,
      )
      .eq('org_id', organizationId)
      .single();

    if (error || !data) {
      console.error('[fetchOrganizationAiAvailableCredits] Supabase error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[fetchOrganizationAiAvailableCredits] Unexpected error:', err);
    return null;
  }
}
