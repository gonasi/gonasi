import type z from 'zod';

import type { LessonSchema } from '@gonasi/schemas/publish/course-lessons';
import { LessonsArraySchema } from '@gonasi/schemas/publish/course-lessons';

import type { TypedSupabaseClient } from '../../client';
import type { LessonValidationError } from './types';

interface FetchLessonsArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  organizationId: string;
}

type LessonsData = z.infer<typeof LessonsArraySchema>;
type LessonData = z.infer<typeof LessonSchema>;
export type LessonKeys = keyof LessonData;

interface LessonsValidationSuccess {
  success: true;
  data: LessonsData;
  errors: null;
  completionStatus: {
    total: number;
    completed: number;
    percentage: number;
  };
}

interface LessonsValidationFailure {
  success: false;
  data: Partial<LessonsData> | null;
  errors: LessonValidationError[];
  completionStatus: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export type LessonsValidationResult = LessonsValidationSuccess | LessonsValidationFailure;

interface RouteParams {
  organizationId: string;
  courseId: string;
  chapterId?: string;
  lessonId?: string;
}

export const LESSON_ERROR_NAVIGATION: Record<LessonKeys, (args: RouteParams) => { route: string }> =
  {
    id: ({ organizationId, courseId, chapterId }) => ({
      route: `/${organizationId}/builder/${courseId}/content/${chapterId}/lessons/new-lesson-details`,
    }),
    course_id: ({ organizationId, courseId }) => ({
      route: `/${organizationId}/builder/${courseId}/chapters`,
    }),
    chapter_id: ({ organizationId, courseId, chapterId }) => ({
      route: `/${organizationId}/builder/${courseId}/chapters/${chapterId}/lessons`,
    }),
    lesson_type_id: ({ organizationId, courseId, chapterId, lessonId }) => ({
      route: `/${organizationId}/builder/${courseId}/content/${chapterId}/lessons/${lessonId}/edit-details`,
    }),
    name: ({ organizationId, courseId, chapterId, lessonId }) => ({
      route: `/${organizationId}/builder/${courseId}/content/${chapterId}/lessons/${lessonId}/edit-details`,
    }),
    position: ({ organizationId, courseId, chapterId, lessonId }) => ({
      route: `/${organizationId}/builder/${courseId}/content/${chapterId}/lessons/${lessonId}/edit-details`,
    }),
    settings: ({ organizationId, courseId, chapterId, lessonId }) => ({
      route: `/${organizationId}/builder/${courseId}/content/${chapterId}/lessons/${lessonId}/edit-details`,
    }),
    blocks: ({ organizationId, courseId, chapterId, lessonId }) => ({
      route: `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks/plugins`,
    }),
    lesson_types: ({ organizationId, courseId, chapterId, lessonId }) => ({
      route: `/${organizationId}/builder/${courseId}/content/${chapterId}/lessons/${lessonId}/edit-details`,
    }),
  };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeLessonDataForValidation(data: any[]): Partial<LessonsData> {
  return data.map((lesson) => {
    const sanitized = {
      ...lesson,
      blocks: lesson.blocks ?? [],
    };

    if (sanitized.name === null) sanitized.name = undefined;
    if (sanitized.course_id === null) sanitized.course_id = undefined;
    if (sanitized.chapter_id === null) sanitized.chapter_id = undefined;
    if (sanitized.lesson_type_id === null) sanitized.lesson_type_id = undefined;
    if (sanitized.position === null) sanitized.position = undefined;
    if (sanitized.settings === null) sanitized.settings = undefined;
    if (sanitized.lesson_types === null) sanitized.lesson_types = undefined;

    return sanitized;
  });
}

function calculateCompletionStatus(data: any[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const lessonRequirements: {
    field: LessonKeys;
    weight: number;
    isValid: (value: any) => boolean;
  }[] = [
    {
      field: 'name',
      weight: 1,
      isValid: (value) => typeof value === 'string' && value.length > 0,
    },
    {
      field: 'lesson_type_id',
      weight: 1,
      isValid: (value) => typeof value === 'string' && value.length > 0,
    },
    {
      field: 'position',
      weight: 1,
      isValid: (value) => typeof value === 'number' && value >= 0,
    },
    {
      field: 'blocks',
      weight: 1,
      isValid: (value) => Array.isArray(value) && value.length >= 2,
    },
  ];

  // Group lessons by chapter
  const lessonsByChapter = data.reduce(
    (acc, lesson) => {
      const chapterId = lesson.chapter_id;
      if (!acc[chapterId]) {
        acc[chapterId] = [];
      }
      acc[chapterId].push(lesson);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  const chapters = Object.keys(lessonsByChapter);
  const chapterRequirementWeight = 1;

  // Calculate total points: (lessons per chapter × lesson requirements) + (chapter requirement per chapter)
  const totalPoints =
    data.length * lessonRequirements.length + chapters.length * chapterRequirementWeight;

  let completedPoints = 0;

  // Check chapter requirements (each chapter needs at least 2 lessons)
  chapters.forEach((chapterId) => {
    const chapterLessons = lessonsByChapter[chapterId];
    if (chapterLessons.length >= 2) {
      completedPoints += chapterRequirementWeight;
    }
  });

  // Check lesson requirements
  data.forEach((lesson) => {
    lessonRequirements.forEach((req) => {
      const value = lesson[req.field];
      if (req.isValid(value)) {
        completedPoints += req.weight;
      }
    });
  });

  const percentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return {
    total: totalPoints,
    completed: completedPoints,
    percentage,
  };
}

export async function fetchAndValidateLessons({
  supabase,
  courseId,
  organizationId,
}: FetchLessonsArgs): Promise<LessonsValidationResult> {
  const delay = Math.floor(Math.random() * 2000) + 1000;
  await sleep(delay);

  const { data, error } = await supabase
    .from('lessons')
    .select(
      `
      id,
      course_id,
      organization_id,
      chapter_id,
      lesson_type_id,
      name,
      position,
      created_at,
      updated_at,
      settings,
      lesson_blocks(id),
      lesson_types(id, name, description, lucide_icon, bg_color)
    `,
    )
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  if (error || !data) {
    return {
      success: false,
      data: null,
      errors: [
        {
          field: 'course_id',
          message: `<lucide name="AlertTriangle" size="12" /> We couldn't find lessons for this course.`,
          navigation: {
            route: `/${organizationId}/builder/${courseId}/chapters`,
          },
        },
      ],
      completionStatus: { total: 0, completed: 0, percentage: 0 },
    };
  }

  const lessonsWithBlocks = data.map((lesson) => ({
    ...lesson,
    blocks: lesson.lesson_blocks ?? [],
  })) as LessonsData;

  const validation = LessonsArraySchema.safeParse(lessonsWithBlocks);

  if (!validation.success) {
    const completionStatus = calculateCompletionStatus(data);

    const lessonValidationErrors: LessonValidationError[] = validation.error.issues.map((issue) => {
      const pathSegments = issue.path;
      const lessonIndex = typeof pathSegments[0] === 'number' ? pathSegments[0] : undefined;
      const field = (pathSegments[pathSegments.length - 1] || 'id') as LessonKeys;

      const lesson = lessonIndex !== undefined ? data[lessonIndex] : undefined;
      const lessonId = lesson?.id;
      const chapterId = lesson?.chapter_id;

      const navigationFn = LESSON_ERROR_NAVIGATION[field];
      const navigation = navigationFn
        ? navigationFn({ organizationId, courseId, chapterId, lessonId })
        : { route: `/${organizationId}/builder/${courseId}/chapters` };

      return {
        field,
        message: issue.message,
        navigation,
        lessonIndex,
        lessonId,
      };
    });

    return {
      success: false,
      data: sanitizeLessonDataForValidation(data),
      errors: lessonValidationErrors,
      completionStatus,
    };
  }

  // When validation succeeds, calculate completion status based on the validated data
  const completionStatus = calculateCompletionStatus(validation.data);

  return {
    success: true,
    data: validation.data,
    errors: null,
    completionStatus,
  };
}
