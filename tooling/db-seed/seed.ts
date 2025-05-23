import {
  type courseCategoriesScalars,
  type courseSubCategoriesScalars,
  createSeedClient,
  type profilesScalars,
} from '@snaplet/seed';

import { convertKeysToCamelCase, supabase } from './src/constants';
import { seedCompleteOnboarding } from './src/seedCompleteOnboarding';
import { seedCourseCategories } from './src/seedCourseCategories';
import { seedCreateCourse } from './src/seedCreateCourse';
import { seedLessonTypes } from './src/seedLessonTypes';
import { seedPathways } from './src/seedPathways';
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

  // Seed lesson types pathways and course categories using profiles
  await seedLessonTypes(profiles);
  await seedPathways(profiles);
  await seedCourseCategories(profiles);

  // Fetch course categories
  const { data: databaseCategories } = await supabase.from('course_categories').select();
  const courseCategories: courseCategoriesScalars[] =
    databaseCategories?.map((category) =>
      convertKeysToCamelCase<courseCategoriesScalars>(category),
    ) ?? [];

  // Fetch course subcategories
  const { data: databaseSubcategories } = await supabase.from('course_sub_categories').select();
  const courseSubCategories: courseSubCategoriesScalars[] =
    databaseSubcategories?.map((subcategory) =>
      convertKeysToCamelCase<courseSubCategoriesScalars>(subcategory),
    ) ?? [];

  // create course titles
  await seedCreateCourse(profiles);

  // Example: You could now seed courses using profiles, categories, and subcategories
  // await seed.courses(x => x(10), { connect: { profiles, courseCategories, courseSubCategories } });

  process.exit();
};

main();
