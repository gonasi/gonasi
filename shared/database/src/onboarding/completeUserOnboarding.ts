import type { BasicInformationType, ContactInformationType } from '@gonasi/schemas/onboarding';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

type OnboardingData = ContactInformationType & BasicInformationType;

export const completeUserOnboarding = async (
  supabase: TypedSupabaseClient,
  onboardingData: OnboardingData,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const { username, fullName, phoneNumber } = onboardingData;

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      full_name: fullName,
      phone_number: phoneNumber,
      is_onboarding_complete: true,
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
