// hooks/useValidationFields.ts
import { useMemo } from 'react';

import type { ValidationField } from './ValidationSection';

interface UseValidationFieldsProps {
  rootRoute: string;
  pricingData?: any[];
}

export function useValidationFields({ rootRoute, pricingData }: UseValidationFieldsProps) {
  const courseOverviewFields = useMemo(
    (): ValidationField[] => [
      { name: 'courseOverview.id', title: 'Course id', fix: '/' },
      { name: 'courseOverview.name', title: 'Course title', fix: '/' },
      {
        name: 'courseOverview.description',
        title: 'Course description',
        fix: `${rootRoute}/overview/edit-details`,
      },
      {
        name: 'courseOverview.imageUrl',
        title: 'Course Thumbnail',
        fix: `${rootRoute}/overview/edit-thumbnail`,
      },
      {
        name: 'courseOverview.courseCategory',
        title: 'Course category',
        fix: `${rootRoute}/overview/grouping/edit-category`,
      },
      {
        name: 'courseOverview.courseSubCategory',
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
      { name: 'pricing', title: 'At least one pricing tier required', fix: `${rootRoute}/pricing` },
    ];

    const pricingTierFields: ValidationField[] =
      pricingData?.flatMap((_, index) => [
        {
          name: `pricing.${index}.paymentFrequency`,
          title: `Pricing tier ${index + 1} - Payment frequency`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricing.${index}.price`,
          title: `Pricing tier ${index + 1} - Price`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricing.${index}.currencyCode`,
          title: `Pricing tier ${index + 1} - Currency`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricing.${index}.isFree`,
          title: `Pricing tier ${index + 1} - Free/Paid status`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricing.${index}.isActive`,
          title: `Pricing tier ${index + 1} - Active status`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
        {
          name: `pricing.${index}.position`,
          title: `Pricing tier ${index + 1} - Position`,
          fix: `${rootRoute}/pricing/edit/${index}`,
        },
      ]) ?? [];

    return [...basePricingFields, ...pricingTierFields];
  }, [rootRoute, pricingData]);

  return { courseOverviewFields, pricingFields };
}
