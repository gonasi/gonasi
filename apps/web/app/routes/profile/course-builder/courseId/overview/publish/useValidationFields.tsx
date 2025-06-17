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
      {
        name: 'lessonsWithBlocks.orphanedLessons',
        fix: `${rootRoute}/content`,
      },
    ];

    if (!lessonsWithBlocks || lessonsWithBlocks.length === 0) {
      return baseLessonsFields;
    }

    // Create validation fields for each lesson
    const lessonFields: ValidationField[] = lessonsWithBlocks.flatMap(
      (lesson: any, lessonIndex: number) => {
        const baseLessonFields = [
          // Direct lesson validation paths (flattened array structure)
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
          lesson.blocks?.flatMap((block: any, blockIndex: number) => [
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
          ]) || [];

        return [...baseLessonFields, ...blockFields];
      },
    );

    // Add chapter-specific validation fields for groupBy validation
    const chapterFields: ValidationField[] = [];

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

    return [...baseLessonsFields, ...lessonFields, ...chapterFields];
  }, [rootRoute, lessonsWithBlocks]);

  return {
    courseOverviewFields,
    pricingFields,
    courseChaptersFields,
    lessonsWithBlocksFields,
  };
}
