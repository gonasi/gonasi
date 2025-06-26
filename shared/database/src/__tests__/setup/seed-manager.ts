import { faker } from '@snaplet/copycat';

import { signUpWithEmailAndPassword } from '../../auth';
import { completeUserOnboarding } from '../../onboarding';
import { TEST_USERS } from '../fixtures/test-data';
import { seedLessonTypes } from '../seeds/seedLessonTypes';
import { seedOrganizationPricingTiers } from '../seeds/seedOrganizationPricingTiers';
import { testSupabase } from './test-helpers';

export class SeedManager {
  // seed data needed

  static async signUpUsers() {
    for (const { email, password, fullName } of TEST_USERS) {
      if (!email || !password) continue;

      const { error } = await signUpWithEmailAndPassword(testSupabase, {
        email,
        password,
        fullName,
      });

      if (error) {
        throw new Error(`❌ Sign-up failed for ${email}: ${error.message}`);
      }
    }
  }

  static async completeOnboardingForUsers() {
    const { data: profiles, error } = await testSupabase.from('profiles').select();

    if (error || !profiles) {
      throw new Error(`❌ Failed to fetch profiles: ${error?.message ?? 'Unknown error'}`);
    }

    for (const { email } of profiles) {
      const username = faker.internet.userName().toLowerCase();
      const fullName = faker.person.fullName();

      const { success, message } = await completeUserOnboarding(testSupabase, {
        username,
        fullName,
      });

      if (!success) {
        throw new Error(`❌ Onboarding failed for ${email}: ${message}`);
      }
    }
  }

  static async seedLessonTypes() {
    const { data: profiles, error } = await testSupabase.from('profiles').select();

    if (error || !profiles) {
      throw new Error(`❌ Failed to fetch profiles: ${error?.message ?? 'Unknown error'}`);
    }

    await seedLessonTypes(profiles);
  }

  static async seedPricingTiers() {
    const { data: profiles, error } = await testSupabase.from('profiles').select();

    if (error || !profiles) {
      throw new Error(`❌ Failed to fetch profiles: ${error?.message ?? 'Unknown error'}`);
    }

    await seedOrganizationPricingTiers(profiles);
  }
}
