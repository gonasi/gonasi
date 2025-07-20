import { z } from 'zod';

// Block progress schema
export const BlockProgressSchema = z.object({
  is_completed: z.boolean(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  time_spent_seconds: z.number().int().nonnegative().nullable(),
  score: z.number().min(0).max(1).nullable(),
  attempts: z.number().int().nonnegative(),
  state: z.any().nullable(),
  last_response: z.any().nullable(),
  feedback: z.any().nullable(),
  completion_quality: z.enum(['excellent', 'good', 'fair', 'needs_improvement']).nullable(),
  recently_completed: z.boolean(),
});

// Legacy lesson progress schema (for backward compatibility)
export const LegacyLessonProgressSchema = z.object({
  total_blocks: z.number().int().nonnegative(),
  average_score: z.number().nullable(),
  completed_blocks: z.number().int().nonnegative(),
  total_time_spent: z.number().int().nonnegative(),
  last_completed_at: z.string().datetime().nullable(),
  is_fully_completed: z.boolean(),
  completion_percentage: z.number().min(0).max(100),
  suggested_next_block_id: z.string().uuid().nullable(),
  next_incomplete_block_id: z.string().uuid().nullable(),
});

// Enhanced lesson progress schema (matches DB function output)
export const EnhancedLessonProgressSchema = z.object({
  total_blocks: z.number().int().nonnegative(),
  visible_blocks: z.number().int().nonnegative(),
  completed_blocks: z.number().int().nonnegative(),
  available_blocks: z.number().int().nonnegative(),
  in_progress_blocks: z.number().int().nonnegative(),
  locked_blocks: z.number().int().nonnegative(),
  completion_percentage: z.number().min(0).max(100),
  overall_completion_percentage: z.number().min(0).max(100),
  is_fully_completed: z.boolean(),
  total_time_spent: z.number().int().nonnegative(),
  average_score: z.number().min(0).max(1).nullable(),
  last_completed_at: z.string().datetime().nullable(),
  next_action: z
    .object({
      block_id: z.string().uuid(),
      action: z.string(),
      position: z.number().int(),
    })
    .nullable(),
  recommended_next_step: z.enum([
    'continue_learning',
    'complete_current',
    'unlock_more_content',
    'lesson_complete',
    'start_learning',
  ]),
});

export type BlockProgressSchemaTypes = z.infer<typeof BlockProgressSchema>;
export type LegacyLessonProgressSchemaTypes = z.infer<typeof LegacyLessonProgressSchema>;
export type EnhancedLessonProgressSchemaTypes = z.infer<typeof EnhancedLessonProgressSchema>;
