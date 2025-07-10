import { useCallback, useMemo } from 'react';

import type { CourseChaptersLessonsLoaderReturnType } from '../../publish-index';
import type { ValidationField } from '../ValidationSection';

interface UseCourseChaptersFieldsProps {
  rootRoute: string;
  courseChapters?: CourseChaptersLessonsLoaderReturnType;
  validationErrors?: string[];
}

export function useCourseChaptersFields({
  rootRoute,
  courseChapters,
  validationErrors,
}: UseCourseChaptersFieldsProps) {
  const errorSet = useMemo(() => {
    return validationErrors ? new Set(validationErrors) : null;
  }, [validationErrors]);

  const createChapterFields = useCallback(
    (chapter: any): ValidationField[] => {
      return [
        {
          name: `courseChapters.${chapter.id}.lesson_count`,
          fix: `${rootRoute}/content/${chapter.id}/edit`,
        },
        {
          name: `courseChapters.${chapter.id}.insufficientLessons`,
          fix: `${rootRoute}/content/${chapter.id}/new-lesson-details`,
        },
        {
          name: `courseChapters.${chapter.id}.id`,
          fix: `${rootRoute}/content/${chapter.id}/edit`,
        },
        {
          name: `courseChapters.${chapter.id}.course_id`,
          fix: `${rootRoute}/content/${chapter.id}/edit`,
        },
        {
          name: `courseChapters.${chapter.id}.name`,
          fix: `${rootRoute}/content/${chapter.id}/edit`,
        },
        {
          name: `courseChapters.${chapter.id}.description`,
          fix: `${rootRoute}/content/${chapter.id}/edit`,
        },
        {
          name: `courseChapters.${chapter.id}.position`,
          fix: `${rootRoute}/content/${chapter.id}/edit`,
        },
        {
          name: `courseChapters.${chapter.id}.lessons`,
          fix: `${rootRoute}/content`,
        },
        {
          name: `courseChapters.${chapter.id}.requires_payment`,
          fix: `${rootRoute}/content/${chapter.id}/edit`,
        },
      ];
    },
    [rootRoute],
  );

  const fields = useMemo((): ValidationField[] => {
    if (errorSet === null) {
      // No error filtering - return all fields
      const baseChapterFields: ValidationField[] = [
        {
          name: 'courseChapters.pricing',
          fix: `${rootRoute}/content`,
        },
        {
          name: 'courseChapters.chapterCount',
          fix: `${rootRoute}/content`,
        },
      ];

      const chapterFields = courseChapters?.flatMap(createChapterFields) ?? [];
      return [...baseChapterFields, ...chapterFields];
    }

    if (!errorSet || errorSet.size === 0) {
      return [];
    }

    const result: ValidationField[] = [];

    // Check base chapter fields
    const baseFields = [
      {
        name: 'courseChapters.pricing',
        fix: `${rootRoute}/content`,
      },
      {
        name: 'courseChapters.chapterCount',
        fix: `${rootRoute}/content`,
      },
    ];

    for (const field of baseFields) {
      if (errorSet.has(field.name)) {
        result.push(field);
      }
    }

    // Process chapters efficiently
    if (courseChapters) {
      for (const chapter of courseChapters) {
        const chapterFields = createChapterFields(chapter);
        for (const field of chapterFields) {
          if (errorSet.has(field.name)) {
            result.push(field);
          }
        }
      }
    }

    return result;
  }, [rootRoute, courseChapters, errorSet, createChapterFields]);

  return { fields };
}
