import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface LessonProgress {
  status: 'incomplete' | 'complete';
  chapterId: string;
  lessonId: string;
}

export async function getActiveChapterAndLessonForUser(
  supabase: TypedSupabaseClient,
  courseId: string,
): Promise<LessonProgress | null> {
  const userId = await getUserId(supabase);

  try {
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('id, position')
      .eq('course_id', courseId)
      .order('position');

    if (chaptersError || !chapters || chapters.length === 0) {
      throw new Error('Failed to fetch chapters.');
    }

    const chapterIds = chapters.map((chapter) => chapter.id);
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, chapter_id, position')
      .in('chapter_id', chapterIds)
      .order('position');

    if (lessonsError || !lessons || lessons.length === 0) {
      throw new Error('Failed to fetch lessons.');
    }

    const lessonsByChapter = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      if (!lessonsByChapter.has(lesson.chapter_id)) {
        lessonsByChapter.set(lesson.chapter_id, []);
      }
      lessonsByChapter.get(lesson.chapter_id)!.push(lesson);
    }

    for (const [chapterId, chapterLessons] of Array.from(lessonsByChapter.entries())) {
      lessonsByChapter.set(
        chapterId,
        chapterLessons.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      );
    }

    const sortedLessons: { id: string; chapter_id: string; position: number | null }[] = [];
    for (const chapter of chapters) {
      const chapterLessons = lessonsByChapter.get(chapter.id) || [];
      sortedLessons.push(...chapterLessons);
    }

    if (sortedLessons.length === 0) return null;

    const allLessonIds = sortedLessons.map((l) => l.id);

    const { data: completedLessons, error: progressError } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('is_complete', true)
      .in('lesson_id', allLessonIds);

    if (progressError) {
      return null;
    }

    const completedSet = new Set(completedLessons?.map((l) => l.lesson_id) || []);

    const firstIncomplete = sortedLessons.find((l) => !completedSet.has(l.id));

    if (firstIncomplete) {
      return {
        status: 'incomplete',
        chapterId: firstIncomplete.chapter_id,
        lessonId: firstIncomplete.id,
      };
    }

    // All lessons completed
    return { status: 'complete', chapterId: '', lessonId: '' };
  } catch (err) {
    console.error('Error in getActiveChapterAndLessonForUser:', err);
    return null;
  }
}
