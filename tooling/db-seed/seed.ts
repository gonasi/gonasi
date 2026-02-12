import { createSeedClient } from '@snaplet/seed';

import { seedCompleteOnboarding } from './src/seedCompleteOnboarding';
import { seedCourseCategories } from './src/seedCourseCategories';
import { seedCreateCourse } from './src/seedCreateCourse';
import { seedGonasiOrgWallets } from './src/seedGonasiOrgWallets';
import { seedLessonTypes } from './src/seedLessonTypes';
import { seedLiveSessions } from './src/seedLiveSessions';
import { seedOrgNotificationsTypes } from './src/seedOrgNotificationsTypes';
import { seedOwnerOrganizations } from './src/seedOwnerOrganizations';
import { seedPricingTiers } from './src/seedPricingTiers';
import { seedUserNotificationsTypes } from './src/seedUserNotificationsTypes';
import { signUpUsers } from './src/signUpUsers';

const main = async () => {
  const seed = await createSeedClient();

  // Truncate all tables in the database
  await seed.$resetDatabase();

  await seedGonasiOrgWallets();

  // Sign up users (this will also trigger creation of profiles via Supabase triggers)
  await signUpUsers();

  // complete onboarding
  await seedCompleteOnboarding();

  // SU Seeds lesson types, categories and pricing tiers
  await seedLessonTypes();
  await seedCourseCategories();
  await seedPricingTiers();
  await seedUserNotificationsTypes();
  await seedOrgNotificationsTypes();

  await seedOwnerOrganizations();

  // create course titles
  await seedCreateCourse();

  // create live sessions with blocks
  await seedLiveSessions();

  process.exit();
};

main();
