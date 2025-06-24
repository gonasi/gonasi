import type { OnboardingSchemaTypes } from '@gonasi/schemas/onboarding';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const completeUserOnboarding = async (
  supabase: TypedSupabaseClient,
  onboardingData: OnboardingSchemaTypes,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { username, fullName } = onboardingData;

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      full_name: fullName,
    })
    .eq('id', userId);

  if (error) {
    return {
      success: false,
      message: 'Could not update user profile',
    };
  }

  return {
    success: true,
    message: 'User profile successfully updated',
  };
};
