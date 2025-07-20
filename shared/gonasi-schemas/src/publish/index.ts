// Re-export all schemas and types for easy importing

// Base schemas
export * from './base';
export * from './progress';
export * from './progressiveReveal';
export * from './courseStructure';

export {
  PublishedLessonWithProgressiveRevealSchema,
  type PublishedLessonWithProgressiveRevealSchemaTypes,
} from './progressiveReveal';
