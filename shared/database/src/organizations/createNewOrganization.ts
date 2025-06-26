import type { NewOrganizationSchemaTypes } from '@gonasi/schemas/organizations';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

export const createNewOrganization = async (
  supabase: TypedSupabaseClient,
  formData: NewOrganizationSchemaTypes,
) => {
  try {
    // Get the ID of the currently logged-in user
    const userId = await getUserId(supabase);

    // Extract form values
    const { name, handle } = formData;

    // Insert the new organization into the database
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        handle,
        owned_by: userId,
        created_by: userId,
        updated_by: userId,
      })
      .select('handle')
      .single();

    // Handle insertion error
    if (error) {
      console.error({
        path: `[createNewOrganization]`,
        error,
      });
      return {
        success: false,
        message: "We couldn't create your organization. Please try again.",
        data: null,
      };
    }

    // Success!
    return {
      success: true,
      message: '🎉 Organization created successfully!',
      data: data.handle,
    };
  } catch (err) {
    console.error('createNewOrganization threw:', err);
    return {
      success: false,
      message: 'Something went wrong. Please try again shortly.',
      data: null,
    };
  }
};
