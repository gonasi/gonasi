import type { NewOrganizationSchemaTypes } from '@gonasi/schemas/organizations';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { updateActiveOrganization } from './updateActiveOrganization';

export const createNewOrganization = async (
  supabase: TypedSupabaseClient,
  formData: NewOrganizationSchemaTypes,
) => {
  try {
    const userId = await getUserId(supabase);
    const { name, handle } = formData;

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        handle: handle.toLowerCase(),
        owned_by: userId,
        created_by: userId,
        updated_by: userId,
        tier: 'launch',
      })
      .select('id, handle')
      .single();

    if (error) {
      console.error('[createNewOrganization]', error);

      if (error.code === '42501' && error.message?.includes('row-level security policy')) {
        return {
          success: false,
          message:
            "You've reached the maximum number of organizations for your plan. Please upgrade to create more.",
          data: null,
        };
      }

      if (error.code === '23505') {
        return {
          success: false,
          message:
            'An organization with this handle already exists. Please choose a different handle.',
          data: null,
        };
      }

      if (error.code === '23514') {
        if (error.message?.includes('handle_length')) {
          return {
            success: false,
            message: 'Handle must be at least 3 characters long.',
            data: null,
          };
        }

        if (error.message?.includes('handle_lowercase')) {
          return {
            success: false,
            message: 'Handle must be lowercase.',
            data: null,
          };
        }

        return {
          success: false,
          message: 'Invalid data provided. Please check your input and try again.',
          data: null,
        };
      }

      return {
        success: false,
        message: "We couldn't create your organization. Please try again.",
        data: null,
      };
    }

    await updateActiveOrganization({
      supabase,
      organizationId: data.id,
    });

    return {
      success: true,
      message: '🎉 Organization created successfully!',
      data: data.handle,
    };
  } catch (err) {
    console.error('[createNewOrganization] Unexpected error:', err);
    return {
      success: false,
      message: 'Something went wrong. Please try again shortly.',
      data: null,
    };
  }
};
