// hooks/useValidationFields.ts
import { useMemo } from 'react';

import type { ValidateChaptersSchemaTypes } from '@gonasi/schemas/publish';

import type { ValidationField } from './ValidationSection';

interface UseValidationFieldsProps {
  rootRoute: string;
  pricingData?: any[];
  courseChapters?: ValidateChaptersSchemaTypes;
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
      { name: 'courseOverview.id', title: 'Course ID', fix: '/' },
      { name: 'courseOverview.name', title: 'Course title', fix: '/' },
      {
        name: 'courseOverview.description',
        title: 'Course description',
        fix: `${rootRoute}/overview/edit-details`,
      },
      {
        name: 'courseOverview.image_url',
        title: 'Course thumbnail',
        fix: `${rootRoute}/overview/edit-thumbnail`,
      },
      {
        name: 'courseOverview.course_categories',
        title: 'Course category',
        fix: `${rootRoute}/overview/grouping/edit-category`,
      },
      {
        name: 'courseOverview.course_sub_categories',
        title: 'Course sub-category',
        fix: `${rootRoute}/overview/grouping/edit-category`,
      },
      {
        name: 'courseOverview.pathways',
        title: 'Course pathway',
        fix: `${rootRoute}/overview/grouping/edit-pathway`,
      },
    ],
    [rootRoute],
  );

  const pricingFields = useMemo((): ValidationField[] => {
    const basePricingFields: ValidationField[] = [
      {
        name: 'pricingData',
        title: 'At least one pricing tier required',
        fix: `${rootRoute}/pricing`,
      },
    ];

    const pricingTierFields: ValidationField[] =
      pricingData?.flatMap((_, index) => [
        {
          name: `pricingData.${index}.payment_frequency`,
          title: `Pricing tier ${index + 1} - Payment frequency`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricingData.${index}.price`,
          title: `Pricing tier ${index + 1} - Price`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricingData.${index}.currency_code`,
          title: `Pricing tier ${index + 1} - Currency`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricingData.${index}.is_free`,
          title: `Pricing tier ${index + 1} - Free/Paid status`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricingData.${index}.is_active`,
          title: `Pricing tier ${index + 1} - Active status`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricingData.${index}.position`,
          title: `Pricing tier ${index + 1} - Position`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
      ]) ?? [];

    return [...basePricingFields, ...pricingTierFields];
  }, [rootRoute, pricingData]);

  const courseChaptersFields = useMemo((): ValidationField[] => {
    const baseChapterFields: ValidationField[] = [
      {
        name: 'courseChapters',
        title: 'At least one chapter required',
        fix: `${rootRoute}/chapters`,
      },
    ];

    const chapterFields: ValidationField[] =
      courseChapters?.flatMap((chapter, index) => [
        {
          name: `courseChapters.${index}.name`,
          title: `Chapter ${index + 1} - Name`,
          fix: `${rootRoute}/chapters/edit/${chapter.id}`,
        },
        {
          name: `courseChapters.${index}.lessons`,
          title: `Chapter ${index + 1} - At least 2 lessons required`,
          fix: `${rootRoute}/chapters/${chapter.id}/lessons`,
        },
        {
          name: `courseChapters.${index}.requires_payment`,
          title: `Chapter ${index + 1} - Payment requirement`,
          fix: `${rootRoute}/chapters/edit/${chapter.id}`,
        },
      ]) ?? [];

    return [...baseChapterFields, ...chapterFields];
  }, [rootRoute, courseChapters]);

  const lessonsWithBlocksFields = useMemo((): ValidationField[] => {
    const baseLessonsFields: ValidationField[] = [
      {
        name: 'lessonsWithBlocks',
        title: 'At least 2 lessons are required',
        fix: `${rootRoute}/chapters`,
      },
    ];

    const lessonFields: ValidationField[] =
      lessonsWithBlocks?.flatMap((chapterLessons, chapterIndex) =>
        chapterLessons.flatMap((lesson: any, lessonIndex: number) => [
          {
            name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.name`,
            title: `Chapter ${chapterIndex + 1}, Lesson ${lessonIndex + 1} - Name`,
            fix: `${rootRoute}/lessons/edit/${lesson.id}`,
          },
          {
            name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.blocks`,
            title: `Chapter ${chapterIndex + 1}, Lesson ${lessonIndex + 1} - At least 2 blocks required`,
            fix: `${rootRoute}/lessons/${lesson.id}/blocks`,
          },
          {
            name: `lessonsWithBlocks.${chapterIndex}.${lessonIndex}.lesson_type_id`,
            title: `Chapter ${chapterIndex + 1}, Lesson ${lessonIndex + 1} - Lesson type`,
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
