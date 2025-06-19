import { faker } from '@faker-js/faker';
import { type profilesScalars } from '@snaplet/seed';

import { getUserId } from '@gonasi/database/auth';
import { createCourseChapter } from '@gonasi/database/courseChapters';
import {
  createNewCourseTitle,
  fetchCoursesForOwnerOrCollaborators,
} from '@gonasi/database/courses';
import { createLessonDetails, upsertRichTextBlock } from '@gonasi/database/lessons';
import { fetchAllLessonTypes } from '@gonasi/database/lessonTypes';
import { getUserProfile } from '@gonasi/database/profile';

import { CHAPTER_COUNT, LESSONS_FOR_CHAPTER_COUNT, TOTAL_COURSES } from './config';
import { PASSWORD, supabase } from './constants';
import { FAKE_LEXICAL_STATE } from './fakeLexicalData';

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
} {
  return {
    name: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
  };
}

// Seeds the database with course titles, chapters, and lessons for random users
export async function seedCreateCourse(users: profilesScalars[]) {
  const total = TOTAL_COURSES; // Total number of courses to create

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

    const { user: userProfile } = await getUserProfile(supabase);

    // Fetch lesson types
    const { data: lessonTypesData } = await fetchAllLessonTypes({
      supabase,
      limit: 50,
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
    });

    // Log success for course creation
    console.log(success ? `✅ Created course title "${courseTitle}" for ${user.email}` : null);

    if (!success) {
      console.log(`❌ Failed to create course title for ${user.email} - ${message}`);
      break;
    }

    // Fetch user's courses with signed URLs
    const { data: courseData } = await fetchCoursesForOwnerOrCollaborators({
      supabase,
      limit: 100,
      username: userProfile?.username ?? '',
    });

    // Proceed only if there are courses
    if (courseData?.length) {
      for (const course of courseData) {
        if (!course.id) {
          console.log(`❌ Course id not found `);
          break;
        }

        const chapterCount = faker.number.int(CHAPTER_COUNT); // Random number of chapters per course

        for (let j = 0; j < chapterCount; j++) {
          const chapter = generateFakeChapter();

          // Create a new chapter for the course
          const {
            success: chapterSuccess,
            message: chapterMessage,
            data: chapterData,
          } = await createCourseChapter(supabase, {
            courseId: course.id,
            name: chapter.name,
            description: chapter.description,
            requiresPayment: false,
          });

          if (!chapterSuccess || !chapterData) {
            console.error(`❌ Failed to create chapter for "${course.name}": ${chapterMessage}`);
            break;
          }

          console.log(`📘 Created chapter "${chapter.name}" for course "${course.name}"`);

          // Create lessons for the chapter
          const lessonCount = faker.number.int(LESSONS_FOR_CHAPTER_COUNT);
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

            // Create blocks for the lesson
            const blockCount = faker.number.int(BLOCKS_FOR_LESSON_COUNT);
            const playbackMode = faker.helpers.arrayElement(['inline', 'standalone'] as const);

            for (let l = 0; l < blockCount; l++) {
              const richTextSchema = {
                courseId: course.id,
                lessonId: lessonData.id,
                pluginType: 'rich_text_editor' as const,
                content: {
                  richTextState: FAKE_LEXICAL_STATE,
                },
                settings: {
                  playbackMode,
                  weight: faker.number.int({ min: 1, max: 10 }),
                },
              };

              const { success: blockSuccess, message: blockMessage } = await upsertRichTextBlock(
                supabase,
                richTextSchema,
              );

              if (!blockSuccess) {
                console.error(`❌ Failed to create block: ${blockMessage}`);
                break;
              } else {
                console.log(`Lesson block added: ${blockMessage}"`);
              }
            }
          }
        }
      }
    }

    // Sign out the user after operations are complete
    await supabase.auth.signOut();
  }
}
