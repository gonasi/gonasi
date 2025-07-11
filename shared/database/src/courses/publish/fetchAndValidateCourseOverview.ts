import type z from 'zod';

import { CourseOverviewSchema } from '@gonasi/schemas/publish/course-overview';

import type { TypedSupabaseClient } from '../../client';
import type { PublishValidationError } from './types';

interface FetchCourseOverviewArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  organizationId: string;
  chapterId?: string;
}

type CourseOverviewData = z.infer<typeof CourseOverviewSchema>;
export type CourseOverviewKeys = keyof CourseOverviewData;

interface CourseValidationSuccess {
  success: true;
  data: CourseOverviewData;
  errors: null;
  completionStatus: {
    total: number;
    completed: number;
    percentage: number;
  };
}

interface CourseValidationFailure {
  success: false;
  data: Partial<CourseOverviewData> | null;
  errors: PublishValidationError[];
  completionStatus: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export type CourseValidationResult = CourseValidationSuccess | CourseValidationFailure;

interface RouteParams {
  organizationId: string;
  courseId: string;
  chapterId?: string;
}

export const COURSE_ERROR_NAVIGATION: Record<
  CourseOverviewKeys,
  (args: RouteParams) => { route: string }
> = {
  id: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/overview/edit-details`,
  }),
  organization_id: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/overview/edit-details`,
  }),
  name: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/overview/edit-details`,
  }),
  description: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/overview/edit-details`,
  }),
  image_url: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/overview/edit-thumbnail`,
  }),
  blur_hash: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/overview/edit-thumbnail`,
  }),
  visibility: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/overview/edit-details`,
  }),
  course_categories: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/overview/edit-grouping`,
  }),
  course_sub_categories: ({ organizationId, courseId }) => ({
    route: `/${organizationId}/builder/${courseId}/overview/edit-grouping`,
  }),
};

// Utility: Convert `null` fields to `undefined` where Zod requires it
function sanitizeDataForValidationFailure(data: any): Partial<CourseOverviewData> {
  const sanitized: any = { ...data };

  if (sanitized.organization_id === null) sanitized.organization_id = undefined;
  if (sanitized.name === null) sanitized.name = undefined;
  if (sanitized.description === null) sanitized.description = undefined;
  if (sanitized.image_url === null) sanitized.image_url = undefined;
  if (sanitized.blur_hash === null) sanitized.blur_hash = undefined;
  if (sanitized.visibility === null) sanitized.visibility = undefined;
  if (sanitized.course_categories === null) sanitized.course_categories = undefined;
  if (sanitized.course_sub_categories === null) sanitized.course_sub_categories = undefined;

  return sanitized;
}

export async function fetchAndValidateCourseOverview({
  supabase,
  courseId,
  organizationId,
  chapterId,
}: FetchCourseOverviewArgs): Promise<CourseValidationResult> {
  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      organization_id,
      name,
      visibility,
      description,
      image_url,
      blur_hash,
      created_at,
      updated_at,
      created_by,
      updated_by,
      course_categories(id, name),
      course_sub_categories(id, name)
    `,
    )
    .eq('id', courseId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    return {
      success: false,
      data: null,
      errors: [
        {
          field: 'id',
          message: `<lucide name="AlertTriangle" size="12" /> We couldn't find a course with this ID.`,
          navigation: { route: `/org/${organizationId}/course-list` },
        },
      ],
      completionStatus: { total: 0, completed: 0, percentage: 0 },
    };
  }

  const validation = CourseOverviewSchema.safeParse(data);

  if (!validation.success) {
    const publishValidationErrors: PublishValidationError[] = validation.error.issues.map(
      (issue) => {
        const field = issue.path[0] as CourseOverviewKeys;
        const navigationFn = COURSE_ERROR_NAVIGATION[field];
        const navigation = navigationFn
          ? navigationFn({ organizationId, courseId, chapterId })
          : { route: `/${organizationId}/builder/${courseId}/overview/edit-details` };

        return {
          field,
          message: issue.message,
          navigation,
        };
      },
    );

    const requiredFields: CourseOverviewKeys[] = [
      'name',
      'description',
      'image_url',
      'course_categories',
      'course_sub_categories',
    ];

    const completedFields = requiredFields.filter((field) => {
      const value = data[field];
      if (field === 'course_categories' || field === 'course_sub_categories') {
        return value && typeof value === 'object' && value.id && value.name;
      }
      return value !== null && value !== undefined && value !== '';
    });

    return {
      success: false,
      data: sanitizeDataForValidationFailure(data),
      errors: publishValidationErrors,
      completionStatus: {
        total: requiredFields.length,
        completed: completedFields.length,
        percentage: Math.round((completedFields.length / requiredFields.length) * 100),
      },
    };
  }

  return {
    success: true,
    data: validation.data,
    errors: null,
    completionStatus: {
      total: 5,
      completed: 5,
      percentage: 100,
    },
  };
}
