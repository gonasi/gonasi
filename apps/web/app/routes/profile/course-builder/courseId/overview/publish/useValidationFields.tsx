// hooks/useValidationFields.ts
import { useMemo } from 'react';

import type {
  CourseChaptersLessonsLoaderReturnType,
  LessonBlocksLoaderReturnType,
} from '../publish-index';
import type { ValidationField } from './ValidationSection';

interface UseValidationFieldsProps {
  rootRoute: string;
  pricingData?: any[];
  courseChapters?: CourseChaptersLessonsLoaderReturnType;
  lessonsWithBlocks?: LessonBlocksLoaderReturnType;
  validationErrors?: {
    courseOverview?: string[];
    pricingData?: string[];
    courseChapters?: string[];
    lessonsWithBlocks?: string[];
  };
}

export function useValidationFields({
  rootRoute,
  pricingData,
  courseChapters,
  lessonsWithBlocks,
  validationErrors,
}: UseValidationFieldsProps) {
  // Convert error arrays to Sets for O(1) lookup
  const errorSets = useMemo(() => {
    if (!validationErrors) return null;

    return {
      courseOverview: validationErrors.courseOverview
        ? new Set(validationErrors.courseOverview)
        : null,
      pricingData: validationErrors.pricingData ? new Set(validationErrors.pricingData) : null,
      courseChapters: validationErrors.courseChapters
        ? new Set(validationErrors.courseChapters)
        : null,
      lessonsWithBlocks: validationErrors.lessonsWithBlocks
        ? new Set(validationErrors.lessonsWithBlocks)
        : null,
    };
  }, [validationErrors]);

  const courseOverviewFields = useMemo((): ValidationField[] => {
    const allFields = [
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
    ];

    // Return only fields that have errors, or all fields if no filtering
    return errorSets?.courseOverview
      ? allFields.filter((field) => errorSets.courseOverview!.has(field.name))
      : errorSets
        ? []
        : allFields;
  }, [rootRoute, errorSets]);

  const pricingFields = useMemo((): ValidationField[] => {
    if (errorSets && !errorSets.pricingData) return [];

    const basePricingFields: ValidationField[] = [
      {
        name: 'pricingData',
        fix: `${rootRoute}/pricing`,
      },
    ];

    const pricingTierFields: ValidationField[] =
      pricingData?.flatMap((pricingTier) => {
        const tierFields = [
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
        ];

        // Filter during creation if we have error filtering
        return errorSets?.pricingData
          ? tierFields.filter((field) => errorSets.pricingData!.has(field.name))
          : tierFields;
      }) ?? [];

    const allFields = [...basePricingFields, ...pricingTierFields];

    return errorSets?.pricingData
      ? allFields.filter((field) => errorSets.pricingData!.has(field.name))
      : allFields;
  }, [rootRoute, pricingData, errorSets]);

  const courseChaptersFields = useMemo((): ValidationField[] => {
    if (errorSets && !errorSets.courseChapters) return [];

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

    const chapterFields: ValidationField[] =
      courseChapters?.flatMap((chapter) => {
        const chapterFieldsForChapter = [
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

        // Filter during creation if we have error filtering
        return errorSets?.courseChapters
          ? chapterFieldsForChapter.filter((field) => errorSets.courseChapters!.has(field.name))
          : chapterFieldsForChapter;
      }) ?? [];

    const allFields = [...baseChapterFields, ...chapterFields];

    return errorSets?.courseChapters
      ? allFields.filter((field) => errorSets.courseChapters!.has(field.name))
      : allFields;
  }, [rootRoute, courseChapters, errorSets]);

  const lessonsWithBlocksFields = useMemo((): ValidationField[] => {
    if (errorSets && !errorSets.lessonsWithBlocks) return [];

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
      return errorSets?.lessonsWithBlocks
        ? baseLessonsFields.filter((field) => errorSets.lessonsWithBlocks!.has(field.name))
        : baseLessonsFields;
    }

    // Create validation fields for each lesson
    const lessonFields: ValidationField[] = lessonsWithBlocks.flatMap(
      (lesson: any, lessonIndex: number) => {
        const baseLessonFields = [
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

        // Block validation fields
        const blockFields =
          lesson.blocks?.flatMap((block: any, blockIndex: number) => {
            const blockFieldsForBlock = [
              {
                name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.plugin_type`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.id`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.content`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.settings`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.position`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.lesson_id`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${lessonIndex}.blocks.${blockIndex}.updated_by`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
            ];

            // Filter during creation if we have error filtering
            return errorSets?.lessonsWithBlocks
              ? blockFieldsForBlock.filter((field) => errorSets.lessonsWithBlocks!.has(field.name))
              : blockFieldsForBlock;
          }) || [];

        const lessonFieldsForLesson = [...baseLessonFields, ...blockFields];

        // Filter during creation if we have error filtering
        return errorSets?.lessonsWithBlocks
          ? lessonFieldsForLesson.filter((field) => errorSets.lessonsWithBlocks!.has(field.name))
          : lessonFieldsForLesson;
      },
    );

    // Add chapter-specific validation fields for groupBy validation
    const chapterFields: ValidationField[] = [];

    if (!errorSets?.lessonsWithBlocks) {
      // Group lessons by chapter to create chapter-specific error paths
      const lessonsByChapter = lessonsWithBlocks.reduce(
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

      // Create validation fields for chapter-specific errors
      Object.keys(lessonsByChapter).forEach((chapterId) => {
        chapterFields.push({
          name: `lessonsWithBlocks.chapters.${chapterId}.noLessons`,
          fix: `${rootRoute}/content/${chapterId}/new-lesson-details`,
        });
      });
    }

    const allFields = [...baseLessonsFields, ...lessonFields, ...chapterFields];

    return errorSets?.lessonsWithBlocks
      ? allFields.filter((field) => errorSets.lessonsWithBlocks!.has(field.name))
      : allFields;
  }, [rootRoute, lessonsWithBlocks, errorSets]);

  return {
    courseOverviewFields,
    pricingFields,
    courseChaptersFields,
    lessonsWithBlocksFields,
  };
}
