import { useCallback, useMemo } from 'react';

import type { LessonBlocksLoaderReturnType } from '../../publish-index';
import type { ValidationField } from '../ValidationSection';

interface UseLessonsWithBlocksFieldsProps {
  rootRoute: string;
  lessonsWithBlocks?: LessonBlocksLoaderReturnType;
  validationErrors?: string[];
}

export function useLessonsWithBlocksFields({
  rootRoute,
  lessonsWithBlocks,
  validationErrors,
}: UseLessonsWithBlocksFieldsProps) {
  const errorSet = useMemo(() => {
    return validationErrors ? new Set(validationErrors) : null;
  }, [validationErrors]);

  // Memoize chapter grouping to avoid recalculation
  const lessonsByChapter = useMemo(() => {
    if (!lessonsWithBlocks) return {};

    return lessonsWithBlocks.reduce(
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
  }, [lessonsWithBlocks]);

  const createBlockFields = useCallback(
    (block: any, lessonId: string, lessonIndex: number, blockIndex: number): ValidationField[] => {
      return [
        {
          name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.plugin_type`,
          fix: `${rootRoute}/lessons/${lessonId}/blocks/edit/${block.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.id`,
          fix: `${rootRoute}/lessons/${lessonId}/blocks/edit/${block.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.content`,
          fix: `${rootRoute}/lessons/${lessonId}/blocks/edit/${block.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.settings`,
          fix: `${rootRoute}/lessons/${lessonId}/blocks/edit/${block.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.position`,
          fix: `${rootRoute}/lessons/${lessonId}/blocks/edit/${block.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.lesson_id`,
          fix: `${rootRoute}/lessons/${lessonId}/blocks/edit/${block.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.updated_by`,
          fix: `${rootRoute}/lessons/${lessonId}/blocks/edit/${block.id}`,
        },
      ];
    },
    [rootRoute],
  );

  const createLessonFields = useCallback(
    (lesson: any, lessonIndex: number): ValidationField[] => {
      return [
        {
          name: `lessonsWithBlocks.${lessonIndex}.id`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.course_id`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.chapter_id`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.name`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.lesson_type_id`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.position`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.settings`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.lesson_types.id`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.lesson_types.name`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.lesson_types.description`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.lesson_types.lucide_icon`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.lesson_types.bg_color`,
          fix: `${rootRoute}/lessons/edit/${lesson.id}`,
        },
        {
          name: `lessonsWithBlocks.${lessonIndex}.blocks`,
          fix: `${rootRoute}/lessons/${lesson.id}/blocks`,
        },
      ];
    },
    [rootRoute],
  );

  // Separate the heavy computation from loading state management
  const fields = useMemo((): ValidationField[] => {
    const baseLessonsFields: ValidationField[] = [
      {
        name: 'lessonsWithBlocks.noLessonsInCourse',
        fix: `${rootRoute}/content`,
      },
      {
        name: 'lessonsWithBlocks.orphanedLessons',
        fix: `${rootRoute}/content`,
      },
    ];

    if (!lessonsWithBlocks || lessonsWithBlocks.length === 0) {
      return errorSet
        ? baseLessonsFields.filter((field) => errorSet.has(field.name))
        : errorSet === null
          ? baseLessonsFields
          : [];
    }

    if (errorSet === null) {
      // No error filtering - return all fields (optimized processing)
      const result: ValidationField[] = [...baseLessonsFields];

      // Process lessons and blocks efficiently
      lessonsWithBlocks.forEach((lesson, lessonIndex) => {
        const lessonFields = createLessonFields(lesson, lessonIndex);
        result.push(...lessonFields);

        if (lesson.blocks) {
          lesson.blocks.forEach((block: any, blockIndex: number) => {
            const blockFields = createBlockFields(block, lesson.id, lessonIndex, blockIndex);
            result.push(...blockFields);
          });
        }
      });

      // Add chapter-specific validation fields
      Object.keys(lessonsByChapter).forEach((chapterId) => {
        result.push({
          name: `lessonsWithBlocks.chapters.${chapterId}.noLessons`,
          fix: `${rootRoute}/content/${chapterId}/new-lesson-details`,
        });
      });

      return result;
    }

    if (!errorSet || errorSet.size === 0) {
      return [];
    }

    const result: ValidationField[] = [];

    // Check base fields first
    for (const field of baseLessonsFields) {
      if (errorSet.has(field.name)) {
        result.push(field);
      }
    }

    // Process lessons and blocks efficiently with early termination
    for (let lessonIndex = 0; lessonIndex < lessonsWithBlocks.length; lessonIndex++) {
      const lesson = lessonsWithBlocks[lessonIndex];

      // Check lesson fields
      const lessonFields = createLessonFields(lesson, lessonIndex);
      for (const field of lessonFields) {
        if (errorSet.has(field.name)) {
          result.push(field);
        }
      }

      // Check block fields
      if (lesson && lesson.blocks) {
        for (let blockIndex = 0; blockIndex < lesson.blocks.length; blockIndex++) {
          const block = lesson.blocks[blockIndex];
          const blockFields = createBlockFields(block, lesson.id, lessonIndex, blockIndex);

          for (const field of blockFields) {
            if (errorSet.has(field.name)) {
              result.push(field);
            }
          }
        }
      }
    }

    // Check chapter-specific fields
    for (const chapterId of Object.keys(lessonsByChapter)) {
      const fieldName = `lessonsWithBlocks.chapters.${chapterId}.noLessons`;
      if (errorSet.has(fieldName)) {
        result.push({
          name: fieldName,
          fix: `${rootRoute}/content/${chapterId}/new-lesson-details`,
        });
      }
    }

    return result;
  }, [
    rootRoute,
    lessonsWithBlocks,
    errorSet,
    lessonsByChapter,
    createLessonFields,
    createBlockFields,
  ]);

  return { fields };
}
