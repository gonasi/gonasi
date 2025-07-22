import { z } from 'zod';

// Base schemas for reusable types
const UUIDSchema = z.string().uuid();
const TimestampSchema = z.string().datetime();

// Lesson type schema
const LessonTypeSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  description: z.string(),
  lucide_icon: z.string(),
  bg_color: z.string(),
});

// Lesson progress schema
const LessonProgressSchema = z.object({
  total_blocks: z.number().int().min(0),
  completed_blocks: z.number().int().min(0),
  total_weight: z.number().min(0),
  completed_weight: z.number().min(0),
  progress_percentage: z.number().min(0).max(100),
  completed_at: TimestampSchema.nullable(),
  updated_at: TimestampSchema.nullable().optional(),
});

// Lesson schema with nested progress (nullable for non-enrolled users)
const LessonSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  position: z.number().int().min(0),
  total_blocks: z.number().int().min(1),
  lesson_type: LessonTypeSchema,
  progress: LessonProgressSchema.nullable(), // null for non-enrolled users
});

// Chapter schema with lessons and progress (nullable progress fields for non-enrolled users)
const ChapterSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  position: z.number().int().min(0),
  total_lessons: z.number().int().min(1),
  total_blocks: z.number().int().min(1),
  completed_lessons: z.number().int().min(0).nullable(), // null for non-enrolled users
  completed_blocks: z.number().int().min(0).nullable(), // null for non-enrolled users
  progress_percentage: z.number().min(0).max(100).nullable(), // null for non-enrolled users
  lessons: z.array(LessonSchema),
});

// Course basic info schema
const CourseSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  image_url: z.string().url(),
  blur_hash: z.string().nullable(),
  total_chapters: z.number().int().min(1),
  total_lessons: z.number().int().min(1),
  total_blocks: z.number().int().min(1),
  average_rating: z.number().min(1).max(5).nullable(),
  total_reviews: z.number().int().min(0),
  total_enrollments: z.number().int().min(0),
  published_at: TimestampSchema,
});

// Overall progress schema
const OverallProgressSchema = z.object({
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
});

// Recent activity item schema
const RecentActivityItemSchema = z.object({
  block_id: UUIDSchema,
  lesson_id: UUIDSchema,
  chapter_id: UUIDSchema,
  completed_at: TimestampSchema,
  time_spent_seconds: z.number().int().min(0),
  earned_score: z.number().nullable(),
});

// Statistics schema
const StatisticsSchema = z.object({
  total_time_spent: z.number().int().min(0),
  average_score: z.number().min(0).max(100).nullable(),
  completion_streak: z.number().int().min(0),
  started_at: TimestampSchema.nullable(),
});

// Main course progress overview schema
export const CourseProgressOverviewSchema = z.object({
  course: CourseSchema,
  overall_progress: OverallProgressSchema.nullable(), // null for non-enrolled users
  chapters: z.array(ChapterSchema),
  recent_activity: z.array(RecentActivityItemSchema).nullable(),
  statistics: StatisticsSchema.nullable(), // null for non-enrolled users
});

// Type exports for TypeScript usage
export type CourseProgressOverview = z.infer<typeof CourseProgressOverviewSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type OverallProgress = z.infer<typeof OverallProgressSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type LessonProgress = z.infer<typeof LessonProgressSchema>;
export type LessonType = z.infer<typeof LessonTypeSchema>;
export type RecentActivityItem = z.infer<typeof RecentActivityItemSchema>;
export type Statistics = z.infer<typeof StatisticsSchema>;

// Helper function to validate RPC response
export function validateCourseProgressOverview(data: unknown): CourseProgressOverview {
  return CourseProgressOverviewSchema.parse(data);
}

// Usage example for calling the RPC
export interface GetCourseProgressOverviewParams {
  publishedCourseId: string;
  userId?: string; // Optional - if not provided, uses authenticated user
}

// Example Supabase function call type (adjust based on your Supabase client setup)
export async function getCourseProgressOverview(
  supabase: any, // Replace with your Supabase client type
  params: GetCourseProgressOverviewParams,
): Promise<CourseProgressOverview> {
  const { data, error } = await supabase.rpc('get_course_progress_overview', {
    p_published_course_id: params.publishedCourseId,
    p_user_id: params.userId || null, // Let the RPC handle auth.uid() if not provided
  });

  if (error) {
    throw new Error(`Failed to fetch course progress: ${error.message}`);
  }

  return validateCourseProgressOverview(data);
}

// Helper function to check if user has access to progress data
export function hasProgressAccess(data: CourseProgressOverview): boolean {
  return data.overall_progress !== null;
}

// Helper function to get enrollment status from the response
export function getEnrollmentStatus(
  data: CourseProgressOverview,
): 'enrolled' | 'not_enrolled' | 'logged_out' {
  if (data.overall_progress !== null) {
    return 'enrolled';
  }
  if (data.statistics !== null || data.recent_activity !== null) {
    return 'not_enrolled'; // User is logged in but not enrolled
  }
  return 'logged_out'; // No user context
}
