import type { ChapterKeys } from './fetchAndValidateChapters';
import type { CourseOverviewKeys } from './fetchAndValidateCourseOverview';

export interface BaseValidationError {
  field: string;
  message: string;
  navigation: {
    route: string;
  };
}

export interface PublishValidationError extends BaseValidationError {
  field: CourseOverviewKeys;
}

export interface ChapterValidationError extends BaseValidationError {
  field: ChapterKeys;
  chapterIndex?: number;
  chapterId?: string;
}

// Union type
export type ValidationError = PublishValidationError | ChapterValidationError;
