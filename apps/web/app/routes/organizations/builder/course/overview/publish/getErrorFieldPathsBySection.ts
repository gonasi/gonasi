import type { FieldErrors } from 'react-hook-form';

import type { PublishCourseSchemaTypes } from '@gonasi/schemas/publish';

export function getErrorFieldPathsBySection(errors: FieldErrors<PublishCourseSchemaTypes>) {
  const sections: (keyof PublishCourseSchemaTypes)[] = [
    'courseOverview',
    'pricingData',
    'courseChapters',
    'lessonsWithBlocks',
  ];

  const result: Partial<Record<keyof PublishCourseSchemaTypes, string[]>> = {};

  const getPaths = (obj: any, path: string[] = []): string[] => {
    if (!obj || typeof obj !== 'object') return [];

    return Object.entries(obj).flatMap(([key, value]) => {
      const currentPath = [...path, key];

      if (value && typeof value === 'object' && 'message' in value) {
        return [currentPath.join('.')];
      } else if (Array.isArray(value)) {
        return value.flatMap((item, index) =>
          item ? getPaths(item, [...currentPath, String(index)]) : [],
        );
      } else if (typeof value === 'object' && value !== null) {
        return getPaths(value, currentPath);
      }

      return [];
    });
  };

  for (const section of sections) {
    const sectionErrors = errors[section];
    result[section] = sectionErrors ? getPaths(sectionErrors, [section]) : [];
  }

  return result;
}
