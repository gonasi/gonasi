import { faker } from '@snaplet/copycat';

import { completeUserOnboarding } from '@gonasi/database/onboarding';

import { PASSWORD, supabase } from './constants';
import { SIGNED_UP_EMAILS } from './signUpUsers';

export async function seedCompleteOnboarding() {
  for (const email of SIGNED_UP_EMAILS) {
    // Sign in the user
    await supabase.auth.signInWithPassword({
      email,
      password: PASSWORD,
    });

    // Complete onboarding with fake data
    const { success, message } = await completeUserOnboarding(supabase, {
      username: faker.internet.userName().toLowerCase(),
      fullName: faker.person.fullName(),
    });

    console.log(
      success
        ? `✅ Onboarding completed for ${email}`
        : `❌ Failed to complete onboarding for ${email} - ${message}`,
    );

    // Sign out after onboarding
    await supabase.auth.signOut();
  }
}
