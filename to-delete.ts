import { z } from 'zod';

// Enum definitions
const CourseAccessSchema = z.enum(['public', 'private', 'restricted'], {
  errorMap: () => ({ message: "Course visibility must be 'public', 'private', or 'restricted'" }),
});

const PaymentFrequencySchema = z.enum(['monthly', 'yearly', 'lifetime', 'weekly'], {
  errorMap: () => ({
    message: "Payment frequency must be 'monthly', 'yearly', 'lifetime', or 'weekly'",
  }),
});

const CoursePublicationStatusSchema = z.enum(['published', 'unpublished', 'archived'], {
  errorMap: () => ({ message: "Status must be 'published', 'unpublished', or 'archived'" }),
});

// UUID validation helper
const UUIDSchema = z.string().uuid({
  message: 'Invalid UUID format',
});

// Currency code validation
const CurrencyCodeSchema = z.enum(['KES', 'USD'], {
  errorMap: () => ({ message: "Currency must be 'KES' or 'USD'" }),
});

// Lesson Block Schema
const LessonBlockSchema = z.object({
  id: UUIDSchema,
  plugin_type: z.string().min(1, 'Plugin type is required'),
  position: z.number().int().min(0, 'Block position must be a non-negative integer'),
  content: z.record(z.any()).default({}),
  settings: z.record(z.any()).default({}),
  created_at: z.string().datetime('Invalid datetime format for block creation'),
  updated_at: z.string().datetime('Invalid datetime format for block update'),
  created_by: UUIDSchema,
  updated_by: UUIDSchema,
});

// Lesson Schema
const LessonSchema = z.object({
  id: UUIDSchema,
  name: z
    .string()
    .min(1, 'Lesson name is required')
    .max(255, 'Lesson name must be 255 characters or less'),
  lesson_type_id: UUIDSchema,
  position: z.number().int().min(0, 'Lesson position must be a non-negative integer'),
  settings: z.record(z.any()).default({}),
  created_at: z.string().datetime('Invalid datetime format for lesson creation'),
  updated_at: z.string().datetime('Invalid datetime format for lesson update'),
  created_by: UUIDSchema,
  updated_by: UUIDSchema,
  blocks: z.array(LessonBlockSchema).min(2, {
    message: 'Each lesson must have at least 2 blocks to provide meaningful content',
  }),
});

// Chapter Schema
const ChapterSchema = z.object({
  id: UUIDSchema,
  name: z
    .string()
    .min(1, 'Chapter name is required')
    .max(255, 'Chapter name must be 255 characters or less'),
  description: z.string().nullable().optional(),
  position: z.number().int().min(0, 'Chapter position must be a non-negative integer'),
  created_at: z.string().datetime('Invalid datetime format for chapter creation'),
  updated_at: z.string().datetime('Invalid datetime format for chapter update'),
  created_by: UUIDSchema,
  updated_by: UUIDSchema,
  lessons: z.array(LessonSchema).min(2, {
    message: 'Each chapter must have at least 2 lessons to provide comprehensive coverage',
  }),
});

// Pricing Tier Schema
const PricingTierSchema = z
  .object({
    id: UUIDSchema,
    payment_frequency: PaymentFrequencySchema,
    is_free: z.boolean(),
    price: z
      .number()
      .min(0, 'Price must be non-negative')
      .multipleOf(0.01, 'Price must have at most 2 decimal places'),
    currency_code: CurrencyCodeSchema,
    promotional_price: z
      .number()
      .min(0, 'Promotional price must be non-negative')
      .multipleOf(0.01, 'Promotional price must have at most 2 decimal places')
      .nullable()
      .optional(),
    promotion_start_date: z
      .string()
      .datetime('Invalid datetime format for promotion start')
      .nullable()
      .optional(),
    promotion_end_date: z
      .string()
      .datetime('Invalid datetime format for promotion end')
      .nullable()
      .optional(),
    tier_name: z
      .string()
      .max(100, 'Tier name must be 100 characters or less')
      .nullable()
      .optional(),
    tier_description: z
      .string()
      .max(500, 'Tier description must be 500 characters or less')
      .nullable()
      .optional(),
    is_active: z.boolean(),
    position: z.number().int().min(0, 'Tier position must be a non-negative integer'),
    is_popular: z.boolean(),
    is_recommended: z.boolean(),
    created_at: z.string().datetime('Invalid datetime format for tier creation'),
    updated_at: z.string().datetime('Invalid datetime format for tier update'),
    created_by: UUIDSchema,
    updated_by: UUIDSchema,
  })
  .refine(
    (data) => {
      // If not free, price must be greater than 0
      if (!data.is_free && data.price <= 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Paid courses must have a price greater than 0',
      path: ['price'],
    },
  )
  .refine(
    (data) => {
      // If promotional price exists, it must be less than regular price
      if (data.promotional_price !== null && data.promotional_price !== undefined) {
        return data.promotional_price < data.price;
      }
      return true;
    },
    {
      message: 'Promotional price must be less than the regular price',
      path: ['promotional_price'],
    },
  )
  .refine(
    (data) => {
      // If promotion dates exist, start must be before end
      if (data.promotion_start_date && data.promotion_end_date) {
        return new Date(data.promotion_start_date) < new Date(data.promotion_end_date);
      }
      return true;
    },
    {
      message: 'Promotion start date must be before promotion end date',
      path: ['promotion_end_date'],
    },
  )
  .refine(
    (data) => {
      // Free courses cannot have promotional pricing
      if (data.is_free) {
        return !data.promotional_price && !data.promotion_start_date && !data.promotion_end_date;
      }
      return true;
    },
    {
      message: 'Free courses cannot have promotional pricing',
      path: ['promotional_price'],
    },
  );

// Course Data Schema
const CourseDataSchema = z.object({
  name: z
    .string()
    .min(1, 'Course name is required')
    .max(255, 'Course name must be 255 characters or less'),
  description: z
    .string()
    .max(2000, 'Course description must be 2000 characters or less')
    .nullable()
    .optional(),
  image_url: z.string().url('Invalid image URL format').nullable().optional(),
  blur_hash: z.string().max(100, 'Blur hash must be 100 characters or less').nullable().optional(),
  visibility: CourseAccessSchema,
  pathway_id: UUIDSchema.nullable().optional(),
  category_id: UUIDSchema.nullable().optional(),
  subcategory_id: UUIDSchema.nullable().optional(),
  created_by: UUIDSchema,
  created_at: z.string().datetime('Invalid datetime format for course creation'),
  updated_at: z.string().datetime('Invalid datetime format for course update'),
  updated_by: UUIDSchema,
});

// Course Structure Schema
const CourseStructureSchema = z.object({
  chapters: z.array(ChapterSchema).min(2, {
    message: 'A course must have at least 2 chapters to provide structured learning',
  }),
});

// Main Published Course Schema
export const PublishedCourseSchema = z
  .object({
    id: UUIDSchema,
    course_id: UUIDSchema,
    version: z.number().int().min(1, 'Version must be a positive integer'),
    is_current_version: z.boolean(),

    // Course content
    course_data: CourseDataSchema,
    course_structure: CourseStructureSchema,
    pricing_tiers: z.array(PricingTierSchema).min(1, {
      message: 'Course must have at least one pricing tier',
    }),

    // Publication metadata
    published_at: z.string().datetime('Invalid datetime format for publication'),
    published_by: UUIDSchema,

    // Status tracking
    status: CoursePublicationStatusSchema,
    unpublished_at: z
      .string()
      .datetime('Invalid datetime format for unpublication')
      .nullable()
      .optional(),
    unpublished_by: UUIDSchema.nullable().optional(),
    unpublish_reason: z
      .string()
      .max(500, 'Unpublish reason must be 500 characters or less')
      .nullable()
      .optional(),

    // Performance metrics
    total_lessons: z.number().int().min(0, 'Total lessons must be non-negative'),
    total_chapters: z.number().int().min(0, 'Total chapters must be non-negative'),
    estimated_duration_minutes: z
      .number()
      .int()
      .min(0, 'Estimated duration must be non-negative')
      .nullable()
      .optional(),

    // Audit trail
    created_at: z.string().datetime('Invalid datetime format for creation'),
    updated_at: z.string().datetime('Invalid datetime format for update'),
  })
  .refine(
    (data) => {
      // Validate unpublish logic
      if (data.status === 'unpublished') {
        return data.unpublished_at !== null && data.unpublished_by !== null;
      } else {
        return data.unpublished_at === null && data.unpublished_by === null;
      }
    },
    {
      message: 'Unpublished courses must have unpublished_at and unpublished_by fields set',
      path: ['status'],
    },
  )
  .refine(
    (data) => {
      // Validate that calculated totals match actual structure
      const actualChapters = data.course_structure.chapters.length;
      const actualLessons = data.course_structure.chapters.reduce(
        (sum, chapter) => sum + chapter.lessons.length,
        0,
      );

      return data.total_chapters === actualChapters && data.total_lessons === actualLessons;
    },
    {
      message: 'Total chapters and lessons must match the actual course structure',
      path: ['total_chapters'],
    },
  )
  .refine(
    (data) => {
      // Ensure chapter positions are unique and sequential
      const positions = data.course_structure.chapters.map((c) => c.position);
      const uniquePositions = new Set(positions);
      return uniquePositions.size === positions.length;
    },
    {
      message: 'Chapter positions must be unique within the course',
      path: ['course_structure', 'chapters'],
    },
  )
  .refine(
    (data) => {
      // Ensure lesson positions are unique within each chapter
      for (const chapter of data.course_structure.chapters) {
        const positions = chapter.lessons.map((l) => l.position);
        const uniquePositions = new Set(positions);
        if (uniquePositions.size !== positions.length) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Lesson positions must be unique within each chapter',
      path: ['course_structure', 'chapters'],
    },
  )
  .refine(
    (data) => {
      // Ensure block positions are unique within each lesson
      for (const chapter of data.course_structure.chapters) {
        for (const lesson of chapter.lessons) {
          const positions = lesson.blocks.map((b) => b.position);
          const uniquePositions = new Set(positions);
          if (uniquePositions.size !== positions.length) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message: 'Block positions must be unique within each lesson',
      path: ['course_structure', 'chapters'],
    },
  )
  .refine(
    (data) => {
      // Ensure at least one active pricing tier
      const activeTiers = data.pricing_tiers.filter((tier) => tier.is_active);
      return activeTiers.length > 0;
    },
    {
      message: 'Course must have at least one active pricing tier',
      path: ['pricing_tiers'],
    },
  );

// Type inference
export type PublishedCourse = z.infer<typeof PublishedCourseSchema>;
export type CourseData = z.infer<typeof CourseDataSchema>;
export type CourseStructure = z.infer<typeof CourseStructureSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type LessonBlock = z.infer<typeof LessonBlockSchema>;
export type PricingTier = z.infer<typeof PricingTierSchema>;

// Validation helper function with detailed error reporting
export function validatePublishedCourse(data: unknown): {
  success: boolean;
  data?: PublishedCourse;
  errors?: Array<{
    path: string;
    message: string;
    code: string;
  }>;
} {
  const result = PublishedCourseSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  };
}

// Partial validation schemas for incremental validation
export const CourseDataPartialSchema = CourseDataSchema.partial();
export const CourseStructurePartialSchema = CourseStructureSchema.partial();
export const PricingTierPartialSchema = PricingTierSchema.partial();

// Example usage and validation
export const exampleValidation = () => {
  const sampleData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    course_id: '123e4567-e89b-12d3-a456-426614174001',
    version: 1,
    is_current_version: true,
    course_data: {
      name: 'Web Development Fundamentals',
      description: 'Learn the basics of web development',
      visibility: 'public',
      created_by: '123e4567-e89b-12d3-a456-426614174002',
      created_at: '2025-06-14T10:00:00Z',
      updated_at: '2025-06-14T10:00:00Z',
      updated_by: '123e4567-e89b-12d3-a456-426614174002',
    },
    course_structure: {
      chapters: [
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          name: 'Introduction',
          position: 0,
          created_at: '2025-06-14T10:00:00Z',
          updated_at: '2025-06-14T10:00:00Z',
          created_by: '123e4567-e89b-12d3-a456-426614174002',
          updated_by: '123e4567-e89b-12d3-a456-426614174002',
          lessons: [
            {
              id: '123e4567-e89b-12d3-a456-426614174004',
              name: 'Welcome',
              lesson_type_id: '123e4567-e89b-12d3-a456-426614174005',
              position: 0,
              created_at: '2025-06-14T10:00:00Z',
              updated_at: '2025-06-14T10:00:00Z',
              created_by: '123e4567-e89b-12d3-a456-426614174002',
              updated_by: '123e4567-e89b-12d3-a456-426614174002',
              blocks: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174006',
                  plugin_type: 'rich_text',
                  position: 0,
                  content: { html: '<p>Welcome!</p>' },
                  settings: {},
                  created_at: '2025-06-14T10:00:00Z',
                  updated_at: '2025-06-14T10:00:00Z',
                  created_by: '123e4567-e89b-12d3-a456-426614174002',
                  updated_by: '123e4567-e89b-12d3-a456-426614174002',
                },
                // This would fail validation - needs at least 2 blocks
              ],
            },
            // This would fail validation - needs at least 2 lessons
          ],
        },
        // This would fail validation - needs at least 2 chapters
      ],
    },
    pricing_tiers: [
      {
        id: '123e4567-e89b-12d3-a456-426614174007',
        payment_frequency: 'monthly',
        is_free: false,
        price: 29.99,
        currency_code: 'USD',
        is_active: true,
        position: 0,
        is_popular: false,
        is_recommended: false,
        created_at: '2025-06-14T10:00:00Z',
        updated_at: '2025-06-14T10:00:00Z',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        updated_by: '123e4567-e89b-12d3-a456-426614174002',
      },
    ],
    published_at: '2025-06-14T10:00:00Z',
    published_by: '123e4567-e89b-12d3-a456-426614174002',
    status: 'published',
    total_lessons: 2,
    total_chapters: 2,
    created_at: '2025-06-14T10:00:00Z',
    updated_at: '2025-06-14T10:00:00Z',
  };

  return validatePublishedCourse(sampleData);
};
