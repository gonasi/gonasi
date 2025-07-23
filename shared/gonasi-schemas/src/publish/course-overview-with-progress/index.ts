import { z } from 'zod';

import { PricingSchema } from '../course-pricing';

// === Reusable Schemas ===
const UUIDSchema = z.string().uuid();
const TimestampSchema = z.string().datetime();

// === Organization Schema ===
const PublishOverviewOrganizationSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  handle: z.string(),
  avatar_url: z.string().nullable(),
  blur_hash: z.string().nullable(),
  is_verified: z.boolean().optional(),
});

// === Lesson Type Schema ===
const PublishOverviewLessonTypeSchema = z
  .object({
    id: UUIDSchema.optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    lucide_icon: z.string().optional(),
    bg_color: z.string().optional(),
  })
  .passthrough(); // Allow additional fields from the database

// === Lesson Progress Schema ===
const PublishOverviewLessonProgressSchema = z.object({
  total_blocks: z.number().int().min(0),
  completed_blocks: z.number().int().min(0),
  total_weight: z.number().min(0),
  completed_weight: z.number().min(0),
  progress_percentage: z.number().min(0).max(100),
  completed_at: z.string().nullable(),
  updated_at: z.string().nullable().optional(),
  is_completed: z.boolean(),
});

// === Lesson Schema (Updated to match function output) ===
const PublishOverviewLessonSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  position: z.number().int().min(0),
  total_blocks: z.number().int().min(1),
  lesson_type: PublishOverviewLessonTypeSchema,
  progress: PublishOverviewLessonProgressSchema.nullable(),
  is_active: z.boolean().default(false),
  is_completed: z.boolean().default(false),
});

// === Chapter Schema (Updated to match function output) ===
const PublishOverviewChapterSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  position: z.number().int().min(0),
  total_lessons: z.number().int().min(1),
  lessons: z.array(PublishOverviewLessonSchema),
});

// === Published Chapters with Progress Response Schema ===
export const PublishedChaptersWithProgressSchema = z.array(PublishOverviewChapterSchema);

// === Course Schema ===
const PublishOverviewCourseSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  image_url: z.string(),
  blur_hash: z.string().nullable(),
  total_chapters: z.number().int().min(1),
  total_lessons: z.number().int().min(1),
  total_blocks: z.number().int().min(1),
  pricing_tiers: PricingSchema,
  average_rating: z.number().min(1).max(5).nullable().optional(),
  total_reviews: z.number().int().min(0),
  total_enrollments: z.number().int().min(0),
  published_at: TimestampSchema,
  category_id: UUIDSchema.nullable(),
  category_name: z.string().nullable(),
  subcategory_id: UUIDSchema.nullable(),
  subcategory_name: z.string().nullable(),
});

// === Overall Progress Schema ===
const PublishOverviewOverallProgressSchema = z.object({
  total_blocks: z.number().int().min(0),
  completed_blocks: z.number().int().min(0),
  total_lessons: z.number().int().min(0),
  completed_lessons: z.number().int().min(0),
  total_chapters: z.number().int().min(0),
  completed_chapters: z.number().int().min(0),
  total_weight: z.number().min(0),
  completed_weight: z.number().min(0),
  progress_percentage: z.number().min(0).max(100),
  total_lesson_weight: z.number().min(0),
  completed_lesson_weight: z.number().min(0),
  lesson_progress_percentage: z.number().min(0).max(100),
  completed_at: TimestampSchema.nullable(),
  updated_at: TimestampSchema.nullable(),
  active_chapter_id: UUIDSchema.nullable(),
  active_lesson_id: UUIDSchema.nullable(),
  is_completed: z.boolean(),
});

// === Recent Activity Item Schema ===
const PublishOverviewRecentActivityItemSchema = z.object({
  block_id: UUIDSchema,
  lesson_id: UUIDSchema,
  chapter_id: UUIDSchema,
  completed_at: TimestampSchema,
  time_spent_seconds: z.number().int().min(0),
  earned_score: z.number().nullable(),
  is_completed: z.literal(true),
});

// === User Statistics Schema ===
const PublishOverviewStatisticsSchema = z.object({
  total_time_spent: z.number().int().min(0),
  average_score: z.number().min(0).max(100).nullable(),
  completion_streak: z.number().int().min(0),
  started_at: TimestampSchema.nullable(),
});

// === Main Course Progress Overview Schema ===
export const PublishOverviewCourseProgressOverviewSchema = z.object({
  course: PublishOverviewCourseSchema,
  organization: PublishOverviewOrganizationSchema,
  overall_progress: PublishOverviewOverallProgressSchema.nullable(),
  chapters: z.array(PublishOverviewChapterSchema),
  recent_activity: z.array(PublishOverviewRecentActivityItemSchema).nullable(),
  statistics: PublishOverviewStatisticsSchema.nullable(),
});

// === Type Exports ===
export type PublishOverviewCourseProgressOverview = z.infer<
  typeof PublishOverviewCourseProgressOverviewSchema
>;
export type PublishOverviewCourse = z.infer<typeof PublishOverviewCourseSchema>;
export type PublishOverviewOrganization = z.infer<typeof PublishOverviewOrganizationSchema>;
export type PublishOverviewOverallProgress = z.infer<typeof PublishOverviewOverallProgressSchema>;
export type PublishOverviewChapter = z.infer<typeof PublishOverviewChapterSchema>;
export type PublishOverviewLesson = z.infer<typeof PublishOverviewLessonSchema>;
export type PublishOverviewLessonProgress = z.infer<typeof PublishOverviewLessonProgressSchema>;
export type PublishOverviewLessonType = z.infer<typeof PublishOverviewLessonTypeSchema>;
export type PublishOverviewRecentActivityItem = z.infer<
  typeof PublishOverviewRecentActivityItemSchema
>;
export type PublishOverviewStatistics = z.infer<typeof PublishOverviewStatisticsSchema>;
