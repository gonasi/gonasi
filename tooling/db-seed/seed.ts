import { createSeedClient } from '@snaplet/seed';

import { seedCompleteOnboarding } from './src/seedCompleteOnboarding';
import { seedCourseCategories } from './src/seedCourseCategories';
import { seedLessonTypes } from './src/seedLessonTypes';
import { seedPricingTiers } from './src/seedPricingTiers';
import { signUpUsers } from './src/signUpUsers';

const main = async () => {
  const seed = await createSeedClient();

  // Truncate all tables in the database
  await seed.$resetDatabase();

  // Sign up users (this will also trigger creation of profiles via Supabase triggers)
  await signUpUsers();

  // complete onboarding
  await seedCompleteOnboarding();

  // SU Seeds lesson types, categories and pricing tiers
  await seedLessonTypes();
  await seedCourseCategories();
  await seedPricingTiers();

  // await seedPathways(profiles);

  // Fetch course categories
  // const { data: databaseCategories } = await supabase.from('course_categories').select();
  // const courseCategories: courseCategoriesScalars[] =
  //   databaseCategories?.map((category) =>
  //     convertKeysToCamelCase<courseCategoriesScalars>(category),
  //   ) ?? [];

  // // Fetch course subcategories
  // const { data: databaseSubcategories } = await supabase.from('course_sub_categories').select();
  // const courseSubCategories: courseSubCategoriesScalars[] =
  //   databaseSubcategories?.map((subcategory) =>
  //     convertKeysToCamelCase<courseSubCategoriesScalars>(subcategory),
  //   ) ?? [];

  // create course titles
  //  await seedCreateCourse(profiles);

  // Example: You could now seed courses using profiles, categories, and subcategories
  // await seed.courses(x => x(10), { connect: { profiles, courseCategories, courseSubCategories } });

  process.exit();
};

main();
