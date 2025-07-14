import type { UpdateOrganizationInformationSchemaTypes } from '@gonasi/schemas/organizations/settings/profile';

import type { TypedSupabaseClient } from '../../../client';

/**
 * Updates an organization's profile information.
 */
export const updateOrganizationProfileInformation = async ({
  supabase,
  updates,
}: {
  supabase: TypedSupabaseClient;
  updates: UpdateOrganizationInformationSchemaTypes;
}) => {
  const { organizationId, name, handle, description, websiteUrl } = updates;

  const { error, data } = await supabase
    .from('organizations')
    .update({
      name,
      handle,
      description,
      website_url: websiteUrl,
    })
    .eq('id', organizationId)
    .select()
    .single();

  if (error) {
    console.error('[updateOrganizationProfileInformation]', { error });
    return {
      success: false,
      message: 'Something went wrong while updating the organization profile.',
      data: null,
    };
  }

  return {
    success: true,
    message: 'Organization profile has been updated successfully.',
    data,
  };
};
