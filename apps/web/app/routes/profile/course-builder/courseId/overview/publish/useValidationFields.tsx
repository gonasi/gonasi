// hooks/useValidationFields.ts
import { useMemo } from 'react';

import type { CourseChaptersLessonsLoaderReturnType } from '../publish-course';
import type { ValidationField } from './ValidationSection';

interface UseValidationFieldsProps {
  rootRoute: string;
  pricingData?: any[];
  courseChapters?: CourseChaptersLessonsLoaderReturnType;
  lessonsWithBlocks?: any[];
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
        fix: `${rootRoute}/content`,
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
      courseChapters?.flatMap((_chapter, index) => [
        {
          name: `courseChapters.${index}.lesson_count`,
          fix: `${rootRoute}/content`,
        },
        {
          name: `courseChapters.${index}.id`,
          fix: `${rootRoute}/content`,
        },
        {
          name: `courseChapters.${index}.course_id`,
          fix: `${rootRoute}/content`,
        },
        {
          name: `courseChapters.${index}.name`,
          fix: `${rootRoute}/content`,
        },
        {
          name: `courseChapters.${index}.description`,
          fix: `${rootRoute}/content`,
        },
        {
          name: `courseChapters.${index}.position`,
          fix: `${rootRoute}/content`,
        },
        {
          name: `courseChapters.${index}.lessons`,
          fix: `${rootRoute}/content`,
        },
        {
          name: `courseChapters.${index}.requires_payment`,
          fix: `${rootRoute}/content`,
        },
      ]) ?? [];

    return [...baseChapterFields, ...chapterFields];
  }, [rootRoute, courseChapters]);

  const lessonsWithBlocksFields = useMemo((): ValidationField[] => {
    const baseLessonsFields: ValidationField[] = [
      {
        name: 'lessonsWithBlocks',
        fix: `${rootRoute}/chapters`,
      },
    ];

    const lessonFields: ValidationField[] =
      lessonsWithBlocks?.flatMap((chapterLessons, chapterIndex) =>
        chapterLessons.flatMap((lesson: any, lessonIndex: number) => [
          {
            name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.name`,
            fix: `${rootRoute}/lessons/edit/${lesson.id}`,
          },
          {
            name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.blocks`,
            fix: `${rootRoute}/lessons/${lesson.id}/blocks`,
          },
          {
            name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.lesson_type_id`,
            fix: `${rootRoute}/lessons/edit/${lesson.id}`,
          },
        ]),
      ) ?? [];

    return [...baseLessonsFields, ...lessonFields];
  }, [rootRoute, lessonsWithBlocks]);

  return {
    courseOverviewFields,
    pricingFields,
    courseChaptersFields,
    lessonsWithBlocksFields,
  };
}
