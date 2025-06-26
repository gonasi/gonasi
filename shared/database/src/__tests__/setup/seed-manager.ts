import { faker } from '@snaplet/copycat';

import { seedAllLessonTypes } from './seeds/seedAllLessonTypes';
import { seedOrganizationPricingTiers } from './seeds/seedOrganizationPricingTiers';
import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { completeUserOnboarding } from '../../onboarding';
import { TEST_USERS } from '../fixtures/test-data';
import { TestCleanupManager, testSupabase } from './test-helpers';

type SeedStep = 'users' | 'onboarding' | 'lessonTypes' | 'pricingTiers';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export class SeedManager {
  static async signUpUsers() {
    for (const { email, password, fullName } of TEST_USERS) {
      if (!email || !password) {
        throw new Error(`❌ Missing email or password for user: ${fullName}`);
      }

      const { error } = await signUpWithEmailAndPassword(testSupabase, {
        email,
        password,
        fullName,
      });

      if (error) {
        throw new Error(`❌ Sign-up failed for ${email}: ${error.message}`);
      }

      await sleep(200);
      await TestCleanupManager.signOutAllClients();
    }
  }

  static async completeOnboardingForUsers() {
    await TestCleanupManager.signOutAllClients();

    for (const { email, password } of TEST_USERS) {
      if (!email || !password) {
        throw new Error(`❌ Missing email or password for user: ${email}`);
      }

      const { error } = await signInWithEmailAndPassword(testSupabase, {
        email,
        password,
      });

      if (error) {
        throw new Error(`❌ Sign-in failed for ${email}: ${error.message}`);
      }

      const { success, message } = await completeUserOnboarding(testSupabase, {
        username: faker.internet.userName().toLowerCase(),
        fullName: faker.person.fullName(),
      });

      if (!success) {
        throw new Error(`❌ Onboarding failed for ${email}: ${message}`);
      }

      await TestCleanupManager.signOutAllClients();
    }
  }

  static async seedLessonTypes() {
    await seedAllLessonTypes();
  }

  static async seedPricingTiers() {
    await seedOrganizationPricingTiers();
  }

  static async runSeedPipeline(
    steps: SeedStep[] = ['users', 'onboarding', 'lessonTypes', 'pricingTiers'],
  ) {
    try {
      await TestCleanupManager.performFullCleanup();

      for (const step of steps) {
        switch (step) {
          case 'users':
            console.log('🚀 Signing up users...');
            await this.signUpUsers();
            break;
          case 'onboarding':
            console.log('👤 Completing onboarding...');
            await this.completeOnboardingForUsers();
            break;
          case 'lessonTypes':
            console.log('📚 Seeding lesson types...');
            await this.seedLessonTypes();
            break;
          case 'pricingTiers':
            console.log('💸 Seeding pricing tiers...');
            await this.seedPricingTiers();
            break;
          default:
            throw new Error(`❌ Unknown seed step: "${step}"`);
        }
      }

      console.log('✅ Seeding pipeline completed.');
    } catch (err) {
      console.error('❌ Seeding process failed:', err);
      throw err;
    }
  }
}
