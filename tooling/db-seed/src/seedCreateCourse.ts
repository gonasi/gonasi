import { faker } from '@faker-js/faker';
import { type profilesScalars } from '@snaplet/seed';

import { getUserId } from '@gonasi/database/auth';
import { createCourseChapter } from '@gonasi/database/courseChapters';
import {
  createNewCourseTitle,
  fetchCompanyCoursesWithSignedUrlsBySuOrAdmin,
} from '@gonasi/database/courses';
import { createLessonDetails } from '@gonasi/database/lessons';
import { fetchAllLessonTypes } from '@gonasi/database/lessonTypes';

import { PASSWORD, supabase } from './constants';

// Generate a realistic fake course title using random subject + prefix
function generateFakeCourseTitle(): string {
  const prefixes = [
    'Introduction to',
    'Mastering',
    'The Fundamentals of',
    'Advanced',
    'Getting Started with',
    'Practical',
  ];
  const subject = faker.word.words({ count: { min: 1, max: 3 } });
  const prefix = faker.helpers.arrayElement(prefixes);
  return `${prefix} ${subject}`;
}

// Generate a fake chapter object with name, description, and payment requirement
function generateFakeChapter(): {
  name: string;
  description: string;
  requiresPayment: boolean;
} {
  return {
    name: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    requiresPayment: faker.datatype.boolean(),
  };
}

// Seeds the database with course titles, chapters, and lessons for random users
export async function seedCreateCourse(users: profilesScalars[]) {
  const total = 50; // Total number of courses to create

  for (let i = 0; i < total; i++) {
    const user = faker.helpers.arrayElement(users); // Pick a random user

    // Sign in as the selected user
    const signInResult = await supabase.auth.signInWithPassword({
      email: user.email,
      password: PASSWORD,
    });

    if (signInResult.error) {
      console.error(`❌ Failed to sign in as ${user.email}: ${signInResult.error.message}`);
      break;
    }

    // Fetch lesson types
    const { data: lessonTypesData } = await fetchAllLessonTypes({
      supabase,
      limit: 20,
    });

    if (!lessonTypesData.length) {
      console.error(`❌ No lesson types found`);
      break;
    }

    const userId = await getUserId(supabase);

    // Create a new fake course title
    const courseTitle = generateFakeCourseTitle();
    const { success, message } = await createNewCourseTitle(supabase, {
      name: courseTitle,
      companyId: userId,
    });

    // Fetch user's courses with signed URLs
    const { data: courseData } = await fetchCompanyCoursesWithSignedUrlsBySuOrAdmin({
      supabase,
      limit: 50,
      username: userId,
    });

    // Proceed only if there are courses
    if (courseData?.length) {
      for (const course of courseData) {
        const chapterCount = faker.number.int({ min: 4, max: 12 }); // Random number of chapters per course

        for (let j = 0; j < chapterCount; j++) {
          const chapter = generateFakeChapter();

          // Create a new chapter for the course
          const {
            success: chapterSuccess,
            message: chapterMessage,
            data: chapterData,
          } = await createCourseChapter(supabase, {
            courseId: course.id,
            ...chapter,
          });

          if (!chapterSuccess || !chapterData) {
            console.error(`❌ Failed to create chapter for "${course.name}": ${chapterMessage}`);
            continue;
          }

          console.log(`📘 Created chapter "${chapter.name}" for course "${course.name}"`);

          // Create lessons for the chapter
          const lessonCount = faker.number.int({ min: 2, max: 12 });

          for (let k = 0; k < lessonCount; k++) {
            const name = faker.hacker.phrase(); // Generate a fake lesson title
            const lessonType = faker.helpers.arrayElement(lessonTypesData); // Pick a random lesson type

            const {
              success: lessonSuccess,
              message: lessonMessage,
              data: lessonData,
            } = await createLessonDetails(supabase, {
              chapterId: chapterData.id ?? '',
              courseId: course.id,
              lessonType: lessonType.id,
              name,
            });

            if (!lessonSuccess || !lessonData) {
              console.error(`❌ Failed to create lesson for "${name}": ${lessonMessage}`);
              break;
            }

            console.log(`🎥 Created lesson "${name}" in chapter "${chapter.name}"`);
          }
        }
      }
    }

    // Log success/failure for course creation
    console.log(
      success
        ? `✅ Created course title "${courseTitle}" for ${user.email}`
        : `❌ Failed to create course title for ${user.email} - ${message}`,
    );

    // Sign out the user after operations are complete
    await supabase.auth.signOut();
  }
}
