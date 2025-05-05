import type { TypedSupabaseClient } from '../../client';

export interface NextLessonOrChapter {
  nextChapterId: string;
  nextLessonId: string;
}

export async function fetchNextChapterAndLessonId(
  supabase: TypedSupabaseClient,
  courseId: string,
  currentChapterId: string,
  currentLessonId: string,
): Promise<NextLessonOrChapter | null> {
  try {
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('id, position')
      .eq('course_id', courseId)
      .order('position');

    if (chaptersError || !chapters || chapters.length === 0) {
      throw new Error('Failed to fetch chapters.');
    }

    const chapterIds = chapters.map((c) => c.id);

    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, chapter_id, position')
      .in('chapter_id', chapterIds)
      .order('position');

    if (lessonsError || !lessons || lessons.length === 0) {
      throw new Error('Failed to fetch lessons.');
    }

    const lessonsByChapter = new Map<
      string,
      { id: string; chapter_id: string; position: number | null }[]
    >();
    for (const lesson of lessons) {
      if (!lessonsByChapter.has(lesson.chapter_id)) {
        lessonsByChapter.set(lesson.chapter_id, []);
      }
      lessonsByChapter.get(lesson.chapter_id)!.push(lesson);
    }

    // Sort lessons within each chapter
    Array.from(lessonsByChapter.keys()).forEach((chapterId) => {
      const chapterLessons = lessonsByChapter.get(chapterId)!;
      lessonsByChapter.set(
        chapterId,
        chapterLessons.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      );
    });

    // Flatten the lessons in chapter order
    const orderedLessons: { chapter_id: string; id: string }[] = [];
    for (const chapter of chapters) {
      const lessonsInChapter = lessonsByChapter.get(chapter.id) || [];
      orderedLessons.push(...lessonsInChapter.map((l) => ({ chapter_id: l.chapter_id, id: l.id })));
    }

    // Find index of current lesson
    const currentIndex = orderedLessons.findIndex(
      (l) => l.chapter_id === currentChapterId && l.id === currentLessonId,
    );

    if (currentIndex === -1 || currentIndex === orderedLessons.length - 1) {
      return null; // current lesson not found or it's the last one
    }

    const next = orderedLessons[currentIndex + 1];
    if (!next) {
      return null;
    }

    return {
      nextChapterId: next.chapter_id,
      nextLessonId: next.id,
    };
  } catch (err) {
    console.error('Error in getNextChapterAndLesson:', err);
    return null;
  }
}
