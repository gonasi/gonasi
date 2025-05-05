import { faker } from '@snaplet/copycat';
import { type profilesScalars } from '@snaplet/seed';

import { completeUserOnboarding } from '@gonasi/database/onboarding';

import { PASSWORD, supabase } from './constants';

export async function seedCompleteOnboarding(users: profilesScalars[]) {
  for (const user of users) {
    // Sign in the user
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: PASSWORD,
    });

    // Complete onboarding with fake data
    const { success, message } = await completeUserOnboarding(supabase, {
      username: faker.internet.userName().toLowerCase(),
      fullName: faker.person.fullName(),
      phoneNumber: faker.string.numeric(9),
    });

    console.log(
      success
        ? `✅ Onboarding completed for ${user.email}`
        : `❌ Failed to complete onboarding for ${user.email} - ${message}`,
    );

    // Sign out after onboarding
    await supabase.auth.signOut();
  }
}
