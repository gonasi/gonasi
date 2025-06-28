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

    // Pre-check: Verify if user can create more launch tier organizations
    // This provides a better user experience than relying solely on RLS
    const { data: existingOrgs, error: countError } = await supabase
      .from('organizations')
      .select('id', { count: 'exact' })
      .eq('owned_by', userId)
      .eq('tier', 'launch');

    if (countError) {
      console.error('Error checking organization count:', countError);
      return {
        success: false,
        message: 'Something went wrong. Please try again shortly.',
        data: null,
      };
    }

    // If user has 2 or more launch tier organizations, they've hit the limit
    if (existingOrgs && existingOrgs.length >= 2) {
      return {
        success: false,
        message:
          "You've reached the maximum number of organizations for your plan. Please upgrade to create more.",
        data: null,
      };
    }

    // Insert the new organization into the database
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        handle: handle.toLocaleLowerCase(),
        owned_by: userId,
        created_by: userId,
        updated_by: userId,
        tier: 'launch', // Explicitly set the tier
      })
      .select('handle')
      .single();

    // Handle insertion error
    if (error) {
      console.error({
        path: `[createNewOrganization]`,
        error,
      });

      // Check if it's a tier limit error (RLS policy violation)
      // This serves as a fallback in case the pre-check missed something
      if (error.code === '42501' && error.message?.includes('row-level security policy')) {
        return {
          success: false,
          message:
            "You've reached the maximum number of organizations for your plan. Please upgrade to create more.",
          data: null,
        };
      }

      // Handle other common errors
      if (error.code === '23505') {
        // Unique constraint violation
        return {
          success: false,
          message:
            'An organization with this handle already exists. Please choose a different handle.',
          data: null,
        };
      }

      // Handle check constraint violations (handle length, lowercase)
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
        // Generic check constraint error
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
