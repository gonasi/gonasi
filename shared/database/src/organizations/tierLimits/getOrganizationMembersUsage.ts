import type { TypedSupabaseClient } from '../../client';
import type { TierStatus } from './tierLimitsTypes';

/**
 * Result object for checking max members per organization
 */
export interface OrgMembersUsageResult {
  /** Maximum allowed members for this org */
  max_members: number;

  /** Current number of members */
  current_members: number;

  /** True if limit has been reached */
  exceeded_limit: boolean;

  /** True if limit is approaching (>= 80%) */
  approaching_limit: boolean;

  /** Status string */
  status: TierStatus;
}

/**
 * Options for checking organization members usage
 */
export interface OrgMembersUsageOptions {
  supabase: TypedSupabaseClient;
  organizationId: string;
  maxMembers: number;
}

/**
 * ---------------------------------------------------------------------------
 * Checks an organization's usage against the max members limit
 * ---------------------------------------------------------------------------
 */
export const getOrganizationMembersUsage = async ({
  supabase,
  organizationId,
  maxMembers,
}: OrgMembersUsageOptions): Promise<OrgMembersUsageResult> => {
  // Fetch number of members in the organization
  const { data: members, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to fetch organization members: ${error.message}`);
  }

  const currentMembers = members?.length ?? 0;

  const exceeded_limit = currentMembers >= maxMembers;
  const approaching_limit = !exceeded_limit && currentMembers / maxMembers >= 0.8;

  let status: TierStatus = 'success';
  if (exceeded_limit) status = 'error';
  else if (approaching_limit) status = 'warning';

  return {
    max_members: maxMembers,
    current_members: currentMembers,
    exceeded_limit,
    approaching_limit,
    status,
  };
};
