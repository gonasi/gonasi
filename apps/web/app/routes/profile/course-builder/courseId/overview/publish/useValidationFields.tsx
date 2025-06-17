// hooks/useValidationFields.ts
import { useMemo } from 'react';

import type {
  CourseChaptersLessonsLoaderReturnType,
  LessonBlocksLoaderReturnType,
} from '../publish-course';
import type { ValidationField } from './ValidationSection';

interface UseValidationFieldsProps {
  rootRoute: string;
  pricingData?: any[];
  courseChapters?: CourseChaptersLessonsLoaderReturnType;
  lessonsWithBlocks?: LessonBlocksLoaderReturnType;
}

export function useValidationFields({
  rootRoute,
  pricingData,
  courseChapters,
  lessonsWithBlocks,
}: UseValidationFieldsProps) {
  const courseOverviewFields = useMemo(
    (): ValidationField[] => [
      { name: 'courseOverview.id', fix: '/' },
      { name: 'courseOverview.name', fix: '/' },
      {
        name: 'courseOverview.description',
        fix: `${rootRoute}/overview/edit-details`,
      },
      {
        name: 'courseOverview.image_url',
        fix: `${rootRoute}/overview/edit-thumbnail`,
      },
      {
        name: 'courseOverview.course_categories',
        fix: `${rootRoute}/overview/grouping/edit-category`,
      },
      {
        name: 'courseOverview.course_sub_categories',
        fix: `${rootRoute}/overview/grouping/edit-category`,
      },
      {
        name: 'courseOverview.pathways',
        fix: `${rootRoute}/overview/grouping/edit-pathway`,
      },
    ],
    [rootRoute],
  );

  const pricingFields = useMemo((): ValidationField[] => {
    const basePricingFields: ValidationField[] = [
      {
        name: 'pricingData',
        fix: `${rootRoute}/pricing`,
      },
    ];

    // Updated to use pricing tier IDs instead of indexes
    const pricingTierFields: ValidationField[] =
      pricingData?.flatMap((pricingTier) => [
        {
          name: `pricingData.${pricingTier.id}.payment_frequency`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
        {
          name: `pricingData.${pricingTier.id}.price`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
        {
          name: `pricingData.${pricingTier.id}.currency_code`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
        {
          name: `pricingData.${pricingTier.id}.is_free`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
        {
          name: `pricingData.${pricingTier.id}.is_active`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
        {
          name: `pricingData.${pricingTier.id}.position`,
          fix: `${rootRoute}/pricing/manage-pricing-tier/${pricingTier.id}`,
        },
      ]) ?? [];

    return [...basePricingFields, ...pricingTierFields];
  }, [rootRoute, pricingData]);

  const courseChaptersFields = useMemo((): ValidationField[] => {
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

    // Updated to use chapter IDs instead of indexes
    const chapterFields: ValidationField[] =
      courseChapters?.flatMap((chapter) => [
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
      ]) ?? [];

    return [...baseChapterFields, ...chapterFields];
  }, [rootRoute, courseChapters]);

  const lessonsWithBlocksFields = useMemo((): ValidationField[] => {
    const baseLessonsFields: ValidationField[] = [
      {
        name: 'lessonsWithBlocks.noLessonsInCourse',
        fix: `${rootRoute}/content`,
      },
    ];

    // Create a helper to map chapter index to chapter ID for legacy error paths
    const getChapterIdByIndex = (chapterIndex: number): string => {
      return courseChapters?.[chapterIndex]?.id || `chapter-${chapterIndex}`;
    };

    const lessonFields: ValidationField[] =
      lessonsWithBlocks?.flatMap((chapterLessons, chapterIndex) => {
        const chapterId = getChapterIdByIndex(chapterIndex);
        console.log('*******************: ', chapterLessons);
        // Chapter-level validation fields (updated to use chapter IDs)
        const chapterLessonFields: ValidationField[] = [
          {
            name: `lessonsWithBlocks.h.lessons`,
            fix: `${rootRoute}/chapters/${chapterId}/lessons`,
          },
        ];

        // Individual lesson validation fields (updated to use lesson IDs)
        const lessonSpecificFields: ValidationField[] = chapterLessons.flatMap((lesson: any) => {
          const baseLessonFields = [
            // Legacy index-based paths (for backward compatibility)
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.course_id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.chapter_id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.name`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.lesson_type_id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.position`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.settings`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.lesson_types`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.blocks`,
              fix: `${rootRoute}/lessons/${lesson.id}/blocks`,
            },
            // New ID-based error paths from updated schema
            {
              name: `lessons.${lesson.id}.id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessons.${lesson.id}.course_id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessons.${lesson.id}.chapter_id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessons.${lesson.id}.name`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessons.${lesson.id}.lesson_type_id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessons.${lesson.id}.position`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessons.${lesson.id}.settings`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessons.${lesson.id}.lesson_types`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessons.${lesson.id}.blocks`,
              fix: `${rootRoute}/lessons/${lesson.id}/blocks`,
            },
          ];

          // Block validation fields (updated to use block IDs)
          const blockFields =
            lesson.blocks?.flatMap((block: any) => [
              // Legacy index-based paths
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.blocks.${block.id}.plugin_type`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.blocks.${block.id}.id`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.blocks.${block.id}.content`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.blocks.${block.id}.settings`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.blocks.${block.id}.position`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.blocks.${block.id}.lesson_id`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lesson.id}.blocks.${block.id}.updated_by`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              // New ID-based error paths from updated schema
              {
                name: `lessons.${lesson.id}.blocks.${block.id}.plugin_type`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessons.${lesson.id}.blocks.${block.id}.id`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessons.${lesson.id}.blocks.${block.id}.content`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessons.${lesson.id}.blocks.${block.id}.settings`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessons.${lesson.id}.blocks.${block.id}.position`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessons.${lesson.id}.blocks.${block.id}.lesson_id`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessons.${lesson.id}.blocks.${block.id}.updated_by`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
            ]) || [];

          return [...baseLessonFields, ...blockFields];
        });

        return [...chapterLessonFields, ...lessonSpecificFields];
      }) ?? [];

    return [...baseLessonsFields, ...lessonFields];
  }, [rootRoute, lessonsWithBlocks, courseChapters]);

  // Alternative approach: If you're using the map-based schema structure
  const createMapBasedLessonFields = useMemo((): ValidationField[] => {
    if (!lessonsWithBlocks || !courseChapters) return [];

    const fields: ValidationField[] = [
      {
        name: 'noChapters',
        fix: `${rootRoute}/content`,
      },
    ];

    // For each chapter, create validation fields
    courseChapters.forEach((chapter) => {
      const chapterLessons = lessonsWithBlocks.find(
        (chapterLessonArray) => chapterLessonArray[0]?.chapter_id === chapter.id,
      );

      if (chapterLessons) {
        // Chapter-level fields
        fields.push({
          name: `${chapter.id}.lessons`,
          fix: `${rootRoute}/chapters/${chapter.id}/lessons`,
        });

        // Lesson-level fields
        chapterLessons.forEach((lesson: any) => {
          fields.push(
            {
              name: `${chapter.id}.lessons.${lesson.id}.blocks`,
              fix: `${rootRoute}/lessons/${lesson.id}/blocks`,
            },
            {
              name: `${chapter.id}.lessons.${lesson.id}.name`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
          );

          // Block-level fields
          lesson.blocks?.forEach((block: any) => {
            fields.push({
              name: `${chapter.id}.lessons.${lesson.id}.blocks.${block.id}.content`,
              fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
            });
          });
        });
      }
    });

    return fields;
  }, [rootRoute, lessonsWithBlocks, courseChapters]);

  return {
    courseOverviewFields,
    pricingFields,
    courseChaptersFields,
    lessonsWithBlocksFields,
    // Include the map-based fields if you switch to that schema approach
    mapBasedLessonFields: createMapBasedLessonFields,
  };
}

// Helper function to create a lookup map for validation fields
export function createValidationFieldLookup(
  fields: ValidationField[],
): Map<string, ValidationField> {
  return new Map(fields.map((field) => [field.name, field]));
}

// Helper function to find validation field by error path
export function findValidationFieldByPath(
  errorPath: string[],
  validationFields: ValidationField[],
): ValidationField | undefined {
  const pathString = errorPath.join('.');
  return validationFields.find((field) => field.name === pathString);
}

// Helper function to handle both old index-based and new ID-based error paths
export function resolveValidationField(
  errorPath: string[],
  allValidationFields: {
    courseOverviewFields: ValidationField[];
    pricingFields: ValidationField[];
    courseChaptersFields: ValidationField[];
    lessonsWithBlocksFields: ValidationField[];
  },
): ValidationField | undefined {
  const pathString = errorPath.join('.');
  const allFields = [
    ...allValidationFields.courseOverviewFields,
    ...allValidationFields.pricingFields,
    ...allValidationFields.courseChaptersFields,
    ...allValidationFields.lessonsWithBlocksFields,
  ];

  // First try exact match
  let field = allFields.find((f) => f.name === pathString);

  if (!field) {
    // Try partial matches for dynamic paths
    field = allFields.find((f) => {
      const fieldParts = f.name.split('.');
      const pathParts = errorPath;

      // Match patterns like "lessons.{id}.blocks" with "lessons.lesson-123.blocks"
      if (fieldParts.length === pathParts.length) {
        return fieldParts.every((part, index) => {
          return part === pathParts[index] || part.includes('{') || pathParts[index]?.includes('-');
        });
      }

      return false;
    });
  }

  return field;
}
