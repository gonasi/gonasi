import { faker } from '@faker-js/faker';

import { getUserId } from '@gonasi/database/auth';
import { createCourseChapter } from '@gonasi/database/courseChapters';
import { createLessonDetails, upsertLessonBlock } from '@gonasi/database/lessons';
import { fetchAllLessonTypes } from '@gonasi/database/lessonTypes';
import { getUserProfile } from '@gonasi/database/profile';

import {
  BLOCKS_FOR_LESSON_COUNT,
  CHAPTER_COUNT,
  LESSONS_FOR_CHAPTER_COUNT,
  TOTAL_COURSES,
} from './config';
import { PASSWORD, supabase } from './constants';
import { FAKE_LEXICAL_STATE } from './fakeLexicalData';
import { SIGNED_UP_EMAILS } from './signUpUsers';

// Generate a realistic fake course title using random subject + prefix
function generateFakeCourseTitle(): string {
  const prefixes = [
    'Introduction to',
    'Mastering',
    'The Fundamentals of',
    'Advanced',
    'Getting Started with',
    'Practical',
    'Complete Guide to',
    "Beginner's",
    'Professional',
    'Essential',
  ];

  const subjects = [
    'Web Development',
    'Data Science',
    'Digital Marketing',
    'Project Management',
    'Mobile App Development',
    'Machine Learning',
    'UI/UX Design',
    'Cloud Computing',
    'Cybersecurity',
    'Business Analytics',
    'Entrepreneurship',
    'Photography',
    'Content Writing',
    'Financial Planning',
    'Leadership Skills',
  ];

  const prefix = faker.helpers.arrayElement(prefixes);
  const subject = faker.helpers.arrayElement(subjects);
  return `${prefix} ${subject}`;
}

// Generate a fake chapter object with name, description, and payment requirement
function generateFakeChapter(): {
  name: string;
  description: string;
} {
  const chapterTypes = [
    'Getting Started',
    'Core Concepts',
    'Advanced Techniques',
    'Best Practices',
    'Real-world Applications',
    'Case Studies',
    'Hands-on Practice',
    'Project Work',
    'Assessment',
    'Wrap-up',
  ];

  return {
    name: faker.helpers.arrayElement(chapterTypes),
    description: faker.lorem.paragraph(),
  };
}

// Get all organizations for a user
async function getUserOrganizations(userId: string) {
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('id, name, handle')
    .eq('owned_by', userId);

  if (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }

  return organizations || [];
}

// Get course categories for selection
async function getCourseCategories() {
  const { data: categories, error } = await supabase.from('course_categories').select(`
      id,
      name,
      course_sub_categories (
        id,
        name
      )
    `);

  if (error) {
    console.error('Error fetching course categories:', error);
    return [];
  }

  return categories || [];
}

// Seeds the database with course titles, chapters, and lessons for organizations
export async function seedCreateCourse() {
  console.log(`🌱 Starting to seed ${TOTAL_COURSES} courses...`);

  // Get course categories first
  const categories = await getCourseCategories();
  if (categories.length === 0) {
    console.error('❌ No course categories found. Please seed categories first.');
    return;
  }

  for (const email of SIGNED_UP_EMAILS) {
    console.log(`\n👤 Processing courses for user: ${email}`);

    // Sign in as the user
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password: PASSWORD,
    });

    if (signInResult.error) {
      console.error(`❌ Failed to sign in as ${email}: ${signInResult.error.message}`);
      continue;
    }

    const userId = await getUserId(supabase);
    const { user: userProfile } = await getUserProfile(supabase);

    if (!userId || !userProfile) {
      console.error(`❌ Could not get user profile for ${email}`);
      await supabase.auth.signOut();
      continue;
    }

    // Get user's organizations
    const organizations = await getUserOrganizations(userId);

    if (organizations.length === 0) {
      console.log(`⚠️  No organizations found for ${email}, skipping...`);
      await supabase.auth.signOut();
      continue;
    }

    // Fetch lesson types
    const { data: lessonTypesData } = await fetchAllLessonTypes({
      supabase,
      limit: 50,
    });

    if (!lessonTypesData || lessonTypesData.length === 0) {
      console.error(`❌ No lesson types found`);
      await supabase.auth.signOut();
      continue;
    }

    // Create courses for each organization
    for (const org of organizations) {
      console.log(`\n🏢 Creating courses for organization: ${org.name}`);

      const coursesPerOrg = Math.ceil(TOTAL_COURSES / organizations.length);

      for (let i = 0; i < coursesPerOrg; i++) {
        const courseTitle = generateFakeCourseTitle();

        // Select random category and subcategory
        const selectedCategory = faker.helpers.arrayElement(categories);
        const selectedSubcategory =
          selectedCategory.course_sub_categories.length > 0
            ? faker.helpers.arrayElement(selectedCategory.course_sub_categories)
            : null;

        // Create course with organization context
        const courseData = {
          name: courseTitle,
          description: faker.lorem.paragraph(),
          organization_id: org.id,
          category_id: selectedCategory.id,
          subcategory_id: selectedSubcategory?.id || null,
          visibility: faker.helpers.arrayElement(['public', 'private'] as const),
          created_by: userId,
        };

        const { data: insertedCourse, error: courseError } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single();

        if (courseError || !insertedCourse) {
          console.error(`❌ Failed to create course "${courseTitle}": ${courseError?.message}`);
          continue;
        }

        console.log(`✅ Created course: "${courseTitle}" in org "${org.name}"`);

        // Create chapters for the course
        const chapterCount = faker.number.int(CHAPTER_COUNT);

        for (let j = 0; j < chapterCount; j++) {
          const chapter = generateFakeChapter();

          const {
            success: chapterSuccess,
            message: chapterMessage,
            data: chapterData,
          } = await createCourseChapter(supabase, {
            courseId: insertedCourse.id,
            name: `${chapter.name} ${j + 1}`,
            description: chapter.description,
            organizationId: org.id,
          });

          if (!chapterSuccess || !chapterData) {
            console.error(`❌ Failed to create chapter: ${chapterMessage}`);
            continue;
          }

          console.log(`📘 Created chapter: "${chapter.name} ${j + 1}"`);

          // Create lessons for the chapter
          const lessonCount = faker.number.int(LESSONS_FOR_CHAPTER_COUNT);

          for (let k = 0; k < lessonCount; k++) {
            const lessonName = `${faker.hacker.phrase()} - Lesson ${k + 1}`;
            const lessonType = faker.helpers.arrayElement(lessonTypesData);

            const {
              success: lessonSuccess,
              message: lessonMessage,
              data: lessonData,
            } = await createLessonDetails(supabase, {
              organizationId: org.id,
              chapterId: chapterData.id,
              courseId: insertedCourse.id,
              lessonType: lessonType.id,
              name: lessonName,
            });

            if (!lessonSuccess || !lessonData) {
              console.error(`❌ Failed to create lesson: ${lessonMessage}`);
              continue;
            }

            console.log(`    🎥 Created lesson: "${lessonName}"`);

            // Create blocks for the lesson
            const blockCount = faker.number.int(BLOCKS_FOR_LESSON_COUNT);
            const playbackMode = faker.helpers.arrayElement(['inline', 'standalone'] as const);

            for (let l = 0; l < blockCount; l++) {
              const richTextSchema = {
                course_id: insertedCourse.id,
                chapter_id: chapterData.id,
                lesson_id: lessonData.id,
                plugin_type: 'rich_text_editor' as const,
                content: {
                  richTextState: FAKE_LEXICAL_STATE,
                },
                settings: {
                  playbackMode,
                  weight: faker.number.int({ min: 1, max: 10 }),
                },
                organization_id: org.id,
              };

              const { success: blockSuccess, message: blockMessage } = await upsertLessonBlock({
                supabase,
                blockData: richTextSchema,
              });

              if (!blockSuccess) {
                console.error(`❌ Failed to create block: ${blockMessage}`);
              } else {
                console.log(`📝 Created block for lesson`);
              }
            }
          }
        }
      }
    }

    // Sign out after processing user
    await supabase.auth.signOut();
  }

  console.log('\n🎉 Course seeding completed!');
}
