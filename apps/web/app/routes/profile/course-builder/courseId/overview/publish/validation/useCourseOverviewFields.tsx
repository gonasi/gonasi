import { useMemo } from 'react';

import type { ValidationField } from '../ValidationSection';

interface UseCourseOverviewFieldsProps {
  rootRoute: string;
  validationErrors?: string[];
}

export function useCourseOverviewFields({
  rootRoute,
  validationErrors,
}: UseCourseOverviewFieldsProps) {
  const errorSet = useMemo(() => {
    return validationErrors ? new Set(validationErrors) : null;
  }, [validationErrors]);

  const fields = useMemo((): ValidationField[] => {
    const allFields: ValidationField[] = [
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

    return errorSet
      ? allFields.filter((field) => errorSet.has(field.name))
      : errorSet === null
        ? allFields
        : [];
  }, [rootRoute, errorSet]);

  return { fields };
}
