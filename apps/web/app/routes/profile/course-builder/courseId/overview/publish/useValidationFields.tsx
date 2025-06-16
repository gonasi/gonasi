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

    const pricingTierFields: ValidationField[] =
      pricingData?.flatMap((_, index) => [
        {
          name: `pricingData.${index}.payment_frequency`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricingData.${index}.price`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricingData.${index}.currency_code`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricingData.${index}.is_free`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricingData.${index}.is_active`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricingData.${index}.position`,
          fix: `${rootRoute}/pricing/edit/${index}`,
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

    const chapterFields: ValidationField[] =
      courseChapters?.flatMap((chapter, index) => [
        {
          name: `courseChapters.${index}.lesson_count`,
          fix: `${rootRoute}/chapters/edit/${chapter.id}`,
        },
        {
          name: `courseChapters.${index}.id`,
          fix: `${rootRoute}/chapters/edit/${chapter.id}`,
        },
        {
          name: `courseChapters.${index}.course_id`,
          fix: `${rootRoute}/chapters/edit/${chapter.id}`,
        },
        {
          name: `courseChapters.${index}.name`,
          fix: `${rootRoute}/chapters/edit/${chapter.id}`,
        },
        {
          name: `courseChapters.${index}.description`,
          fix: `${rootRoute}/chapters/edit/${chapter.id}`,
        },
        {
          name: `courseChapters.${index}.position`,
          fix: `${rootRoute}/chapters/edit/${chapter.id}`,
        },
        {
          name: `courseChapters.${index}.lessons`,
          fix: `${rootRoute}/chapters/${chapter.id}/lessons`,
        },
        {
          name: `courseChapters.${index}.requires_payment`,
          fix: `${rootRoute}/chapters/edit/${chapter.id}`,
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

    const lessonFields: ValidationField[] =
      lessonsWithBlocks?.flatMap((chapterLessons, chapterIndex) => {
        // Chapter-level validation fields
        const chapterLessonFields: ValidationField[] = [
          {
            name: `lessonsWithBlocks.${chapterIndex}.lessons`,
            fix: `${rootRoute}/chapters/${courseChapters?.[chapterIndex]?.id || chapterIndex}/lessons`,
          },
        ];

        // Individual lesson validation fields
        const lessonSpecificFields: ValidationField[] = chapterLessons.flatMap(
          (lesson: any, lessonIndex: number) => [
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.course_id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.chapter_id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.name`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.lesson_type_id`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.position`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.settings`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.lesson_types`,
              fix: `${rootRoute}/lessons/edit/${lesson.id}`,
            },
            {
              name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.blocks`,
              fix: `${rootRoute}/lessons/${lesson.id}/blocks`,
            },
            // Individual block validation fields
            ...(lesson.blocks?.flatMap((block: any, blockIndex: number) => [
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.blocks.${blockIndex}.plugin_type`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.blocks.${blockIndex}.id`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.blocks.${blockIndex}.content`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.blocks.${blockIndex}.settings`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.blocks.${blockIndex}.position`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.blocks.${blockIndex}.lesson_id`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
              {
                name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.blocks.${blockIndex}.updated_by`,
                fix: `${rootRoute}/lessons/${lesson.id}/blocks/edit/${block.id}`,
              },
            ]) || []),
          ],
        );

        return [...chapterLessonFields, ...lessonSpecificFields];
      }) ?? [];

    return [...baseLessonsFields, ...lessonFields];
  }, [rootRoute, lessonsWithBlocks, courseChapters]);

  return {
    courseOverviewFields,
    pricingFields,
    courseChaptersFields,
    lessonsWithBlocksFields,
  };
}
