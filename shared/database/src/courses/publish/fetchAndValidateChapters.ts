import type z from 'zod';

import type { ChapterSchema } from '@gonasi/schemas/publish/course-chapters';
import { ChaptersArraySchema } from '@gonasi/schemas/publish/course-chapters';

import type { TypedSupabaseClient } from '../../client';
import type { ChapterValidationError } from './types';

interface FetchChaptersArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  organizationId: string;
}

type ChaptersData = z.infer<typeof ChaptersArraySchema>;
type ChapterData = z.infer<typeof ChapterSchema>;
export type ChapterKeys = keyof ChapterData;

interface ChaptersValidationSuccess {
  success: true;
  data: ChaptersData;
  errors: null;
  completionStatus: {
    total: number;
    completed: number;
    percentage: number;
  };
}

interface ChaptersValidationFailure {
  success: false;
  data: Partial<ChaptersData> | null;
  errors: ChapterValidationError[];
  completionStatus: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export type ChaptersValidationResult = ChaptersValidationSuccess | ChaptersValidationFailure;

interface RouteParams {
  organizationId: string;
  courseId: string;
  chapterId?: string;
}

export const CHAPTER_ERROR_NAVIGATION: Record<
  ChapterKeys,
  (args: RouteParams) => { route: string }
> = {
  id: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/content/chapter/new`,
  }),
  course_id: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/chapters`,
  }),
  name: ({ organizationId, courseId, chapterId }) => ({
    route: `/${organizationId}/builder/${courseId}/chapters/${chapterId}/edit-details`,
  }),
  description: ({ organizationId, courseId, chapterId }) => ({
    route: `/${organizationId}/builder/${courseId}/chapters/${chapterId}/edit-details`,
  }),
  position: ({ organizationId, courseId, chapterId }) => ({
    route: `/${organizationId}/builder/${courseId}/chapters/${chapterId}/edit-details`,
  }),
  lesson_count: ({ organizationId, courseId, chapterId }) => ({
    route: `/${organizationId}/builder/${courseId}/chapters/${chapterId}/lessons`,
  }),
  lessons: ({ organizationId, courseId, chapterId }) => ({
    route: `/${organizationId}/builder/${courseId}/content/${chapterId}/lessons/new-lesson-details`,
  }),
};

// Accept inferred type from Supabase + inject lesson_count safely
function sanitizeChapterDataForValidation(data: any[]): Partial<ChaptersData> {
  return data.map((chapter) => {
    const sanitized = {
      ...chapter,
      lesson_count: chapter.lessons?.length ?? 0, // Inject the missing field
    };

    if (sanitized.name === null) sanitized.name = undefined;
    if (sanitized.description === null) sanitized.description = undefined;
    if (sanitized.course_id === null) sanitized.course_id = undefined;
    if (sanitized.position === null) sanitized.position = undefined;
    if (sanitized.lessons === null) sanitized.lessons = [];

    return sanitized;
  });
}

function calculateCompletionStatus(data: any[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  // Per-chapter requirements (based on schema validation)
  const chapterRequirements: {
    field: ChapterKeys;
    weight: number;
    isValid: (value: any) => boolean;
  }[] = [
    {
      field: 'name',
      weight: 1,
      isValid: (value) => typeof value === 'string' && value.length >= 3 && value.length <= 100,
    },
    {
      field: 'description',
      weight: 1,
      isValid: (value) => typeof value === 'string' && value.length >= 10,
    },
    {
      field: 'position',
      weight: 1,
      isValid: (value) => typeof value === 'number' && value >= 0,
    },
    {
      field: 'lessons',
      weight: 1,
      isValid: (value) => Array.isArray(value) && value.length >= 2,
    },
  ];

  // Course-level requirement: need at least 2 chapters
  const courseRequirement = {
    weight: 1,
    isMet: data.length >= 2,
  };

  // Calculate total possible points based on ACTUAL chapters, not minimum
  const totalPoints = data.length * chapterRequirements.length + courseRequirement.weight;

  // Calculate completed points
  let completedPoints = 0;

  // Course-level completion (has at least 2 chapters)
  if (courseRequirement.isMet) {
    completedPoints += courseRequirement.weight;
  }

  // Chapter-level completion (count all actual chapters)
  data.forEach((chapter) => {
    chapterRequirements.forEach((req) => {
      const value = chapter[req.field];
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

export async function fetchAndValidateChapters({
  supabase,
  courseId,
  organizationId,
}: FetchChaptersArgs): Promise<ChaptersValidationResult> {
  const { data, error } = await supabase
    .from('chapters')
    .select(
      `
      id,
      course_id,
      name,
      description,
      created_at,
      updated_at,
      created_by,
      position,
      lessons (
        id
      )
    `,
    )
    .match({ course_id: courseId })
    .order('position', { ascending: true })
    .order('position', { ascending: true, referencedTable: 'lessons' });

  if (error || !data) {
    return {
      success: false,
      data: null,
      errors: [
        {
          field: 'course_id',
          message: `<lucide name="AlertTriangle" size="12" /> We couldn't find chapters for this course.`,
          navigation: { route: `/${organizationId}/builder/${courseId}/chapters` },
        },
      ],
      completionStatus: { total: 0, completed: 0, percentage: 0 },
    };
  }

  const chaptersWithLessonCount = data.map((chapter) => ({
    ...chapter,
    lesson_count: chapter.lessons?.length ?? 0,
  })) as ChaptersData;

  const validation = ChaptersArraySchema.safeParse(chaptersWithLessonCount);

  if (!validation.success) {
    const completionStatus = calculateCompletionStatus(data);

    const chapterValidationErrors: ChapterValidationError[] = validation.error.issues.map(
      (issue) => {
        const pathSegments = issue.path;
        const chapterIndex = typeof pathSegments[0] === 'number' ? pathSegments[0] : undefined;
        const field = (pathSegments[pathSegments.length - 1] || 'id') as ChapterKeys;

        const chapterId =
          chapterIndex !== undefined && data[chapterIndex] ? data[chapterIndex].id : undefined;

        const navigationFn = CHAPTER_ERROR_NAVIGATION[field];
        const navigation = navigationFn
          ? navigationFn({ organizationId, courseId, chapterId })
          : { route: `/${organizationId}/builder/${courseId}/chapters` };

        return {
          field,
          message: issue.message,
          navigation,
          chapterIndex,
          chapterId,
        };
      },
    );

    return {
      success: false,
      data: sanitizeChapterDataForValidation(data),
      errors: chapterValidationErrors,
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
