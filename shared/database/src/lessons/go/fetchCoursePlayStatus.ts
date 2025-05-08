import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';
import type { ApiResponse } from '../../types';

export const COURSE_PLAY_STATUSES = {
  NEXT_LESSON: 'next-lesson',
  NEXT_CHAPTER: 'next-chapter',
  COURSE_COMPLETE: 'course-complete',
  CHAPTER_COMPLETE: 'chapter-complete',
} as const;

export type CoursePlayStatusValue =
  (typeof COURSE_PLAY_STATUSES)[keyof typeof COURSE_PLAY_STATUSES];

interface WithProgress {
  chapterProgress: number;
  courseProgress: number;
  courseName: string;
}

interface LessonInfo {
  id: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
}

interface ChapterInfo {
  id: string;
  title: string;
}

export type CoursePlayStatus =
  | ({
      status: typeof COURSE_PLAY_STATUSES.NEXT_LESSON;
      currentLesson: LessonInfo;
      nextLesson: LessonInfo;
    } & WithProgress)
  | ({
      status: typeof COURSE_PLAY_STATUSES.NEXT_CHAPTER;
      currentChapter: ChapterInfo;
      nextChapter: ChapterInfo;
      currentLesson: LessonInfo;
    } & WithProgress)
  | ({
      status: typeof COURSE_PLAY_STATUSES.COURSE_COMPLETE;
      currentLesson: LessonInfo;
      currentChapter: ChapterInfo;
    } & WithProgress)
  | ({
      status: typeof COURSE_PLAY_STATUSES.CHAPTER_COMPLETE;
      currentLesson: LessonInfo;
      currentChapter: ChapterInfo;
    } & WithProgress);

export const fetchCoursePlayStatus = async (
  supabase: TypedSupabaseClient,
  courseId: string,
  chapterId: string,
  lessonId: string,
): Promise<ApiResponse<CoursePlayStatus>> => {
  const userId = await getUserId(supabase);

  try {
    // Get course info
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return { success: false, message: 'Course not found.' };
    }
    // Get current lesson info
    const { data: currentLesson, error: currentLessonError } = await supabase
      .from('lessons')
      .select('id, name, position')
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .single();

    if (currentLessonError || !currentLesson) {
      return { success: false, message: 'Current lesson not found.' };
    }

    // Get current chapter info
    const { data: currentChapter, error: currentChapterError } = await supabase
      .from('chapters')
      .select('id, name, position')
      .eq('id', chapterId)
      .single();

    if (currentChapterError || !currentChapter) {
      return { success: false, message: 'Chapter not found.' };
    }

    const { data: chapterLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('chapter_id', chapterId)
      .eq('course_id', courseId);

    if (lessonsError || !chapterLessons) {
      return { success: false, message: 'Failed to fetch lessons in chapter.' };
    }

    const lessonIds = chapterLessons.map((l) => l.id);

    const { data: completedLessons } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('is_complete', true)
      .in('lesson_id', lessonIds);

    const totalChapterLessons = lessonIds.length;
    const completedChapterLessons = completedLessons?.length ?? 0;

    const chapterProgress =
      totalChapterLessons > 0
        ? Math.round((completedChapterLessons / totalChapterLessons) * 100)
        : 0;

    const { data: allCourseLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    const courseLessonIds = allCourseLessons?.map((l) => l.id) ?? [];

    const { data: completedCourseLessons } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('is_complete', true)
      .in('lesson_id', courseLessonIds);

    const totalCourseLessons = courseLessonIds.length;
    const completedCourseCount = completedCourseLessons?.length ?? 0;

    const courseProgress =
      totalCourseLessons > 0 ? Math.round((completedCourseCount / totalCourseLessons) * 100) : 0;

    const courseName = course.name;

    const isChapterComplete = completedChapterLessons === totalChapterLessons;

    const currentLessonInfo: LessonInfo = {
      id: currentLesson.id,
      title: currentLesson.name,
      chapterId: currentChapter.id,
      chapterTitle: currentChapter.name,
    };

    const currentChapterInfo: ChapterInfo = {
      id: currentChapter.id,
      title: currentChapter.name,
    };

    if (!isChapterComplete) {
      const { data: nextLesson } = await supabase
        .from('lessons')
        .select('id, name')
        .eq('chapter_id', chapterId)
        .eq('course_id', courseId)
        .gt('position', currentLesson.position)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextLesson) {
        return {
          success: true,
          message: 'Next lesson available.',
          data: {
            status: COURSE_PLAY_STATUSES.NEXT_LESSON,
            currentLesson: currentLessonInfo,
            nextLesson: {
              id: nextLesson.id,
              title: nextLesson.name,
              chapterId,
              chapterTitle: currentChapter.name,
            },
            chapterProgress,
            courseProgress,
            courseName,
          },
        };
      }

      return {
        success: true,
        message: 'Chapter complete.',
        data: {
          status: COURSE_PLAY_STATUSES.CHAPTER_COMPLETE,
          currentLesson: currentLessonInfo,
          currentChapter: currentChapterInfo,
          chapterProgress,
          courseProgress,
          courseName,
        },
      };
    }

    // Chapter is complete, check for next chapter
    const { data: nextChapter } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('course_id', courseId)
      .gt('position', currentChapter.position)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextChapter) {
      return {
        success: true,
        message: 'Next chapter available.',
        data: {
          status: COURSE_PLAY_STATUSES.NEXT_CHAPTER,
          currentChapter: currentChapterInfo,
          nextChapter: {
            id: nextChapter.id,
            title: nextChapter.name,
          },
          currentLesson: currentLessonInfo,
          chapterProgress,
          courseProgress,
          courseName,
        },
      };
    }

    return {
      success: true,
      message: 'Course complete.',
      data: {
        status: COURSE_PLAY_STATUSES.COURSE_COMPLETE,
        currentLesson: currentLessonInfo,
        currentChapter: currentChapterInfo,
        chapterProgress,
        courseProgress,
        courseName,
      },
    };
  } catch (error) {
    console.error('Error in fetchCoursePlayStatus:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
};
