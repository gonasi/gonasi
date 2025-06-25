import { createSeedClient, type profilesScalars } from '@snaplet/seed';

import { convertKeysToCamelCase, supabase } from './src/constants';
import { seedCompleteOnboarding } from './src/seedCompleteOnboarding';
import { seedCourseCategories } from './src/seedCourseCategories';
import { seedLessonTypes } from './src/seedLessonTypes';
import { signUpUsers } from './src/signUpUsers';

const main = async () => {
  const seed = await createSeedClient();

  // Truncate all tables in the database
  await seed.$resetDatabase();

  // Sign up users (this will also trigger creation of profiles via Supabase triggers)
  await signUpUsers();

  // Fetch profiles created via Supabase auth trigger
  const { data: databaseProfiles } = await supabase.from('profiles').select();
  const profiles: profilesScalars[] =
    databaseProfiles?.map((profile) => convertKeysToCamelCase<profilesScalars>(profile)) ?? [];

  // complete onboarding
  await seedCompleteOnboarding(profiles);

  await seedLessonTypes(profiles);
  await seedCourseCategories(profiles);

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
