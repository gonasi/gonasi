import type { ChapterKeys } from './fetchAndValidateChapters';
import type { CourseOverviewKeys } from './fetchAndValidateCourseOverview';
import type { LessonKeys } from './fetchAndValidateLessons';

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

export interface LessonValidationError extends BaseValidationError {
  field: LessonKeys;
  chapterIndex?: number;
  chapterId?: string;
}

// Union type
export type ValidationError =
  | PublishValidationError
  | ChapterValidationError
  | LessonValidationError;
