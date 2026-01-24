import { z } from 'zod';

// =====================================================================================
// Reusable field schemas
// =====================================================================================

const CohortNameSchema = z
  .string({
    required_error: `<lucide name="Users" size="12" /> Give your <span class="go-title">cohort a name</span> to get started.`,
  })
  .min(2, {
    message: `<span class="go-title">Cohort name</span> is too short. Try at least 2 characters.`,
  })
  .max(100, {
    message: `<span class="go-title">Cohort name</span> is too long. Keep it under 100 characters.`,
  })
  .trim();

const CohortDescriptionSchema = z
  .string()
  .max(500, {
    message: `<span class="go-title">Description</span> is too long. Try to keep it under 500 characters.`,
  })
  .trim()
  .optional()
  .nullable();

const CohortStartDateSchema = z
  .string()
  .datetime({ message: 'Invalid start date format' })
  .optional()
  .nullable();

const CohortEndDateSchema = z
  .string()
  .datetime({ message: 'Invalid end date format' })
  .optional()
  .nullable();

const CohortMaxEnrollmentSchema = z
  .number({
    invalid_type_error: 'Max enrollment must be a number',
  })
  .int({ message: 'Max enrollment must be a whole number' })
  .positive({ message: 'Max enrollment must be greater than 0' })
  .optional()
  .nullable();

const CohortIsActiveSchema = z.boolean().default(true);

// =====================================================================================
// Base Cohort Object (merge-safe)
// =====================================================================================

const CohortBaseObjectSchema = z.object({
  name: CohortNameSchema,
  description: CohortDescriptionSchema,
  startDate: CohortStartDateSchema,
  endDate: CohortEndDateSchema,
  maxEnrollment: CohortMaxEnrollmentSchema,
  isActive: CohortIsActiveSchema,
});

type CohortBase = z.infer<typeof CohortBaseObjectSchema>;

// =====================================================================================
// Date range refinement (TS-safe)
// =====================================================================================

const refineCohortDateRange = (data: CohortBase) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
};

// =====================================================================================
// New Cohort Schema
// =====================================================================================

export const NewCohortSchema = CohortBaseObjectSchema.refine(refineCohortDateRange, {
  message: 'Start date must be before end date',
  path: ['endDate'],
});

export type NewCohortSchemaTypes = z.infer<typeof NewCohortSchema>;

export const SubmitNewCohortSchema = CohortBaseObjectSchema.merge(
  z.object({
    organizationId: z.string().uuid(),
    publishedCourseId: z.string().uuid(),
  }),
).refine(refineCohortDateRange, {
  message: 'Start date must be before end date',
  path: ['endDate'],
});

export type NewCohortSubmitValues = z.infer<typeof SubmitNewCohortSchema>;

// =====================================================================================
// Edit Cohort Schema
// =====================================================================================

export const EditCohortSchema = CohortBaseObjectSchema.refine(refineCohortDateRange, {
  message: 'Start date must be before end date',
  path: ['endDate'],
});

export type EditCohortSchemaTypes = z.infer<typeof EditCohortSchema>;

export const SubmitEditCohortSchema = CohortBaseObjectSchema.merge(
  z.object({
    cohortId: z.string().uuid(),
  }),
).refine(refineCohortDateRange, {
  message: 'Start date must be before end date',
  path: ['endDate'],
});

export type EditCohortSubmitValues = z.infer<typeof SubmitEditCohortSchema>;

// =====================================================================================
// Delete Cohort Schema
// =====================================================================================

export const DeleteCohortSchema = z.object({
  cohortId: z.string().uuid(),
});

export type DeleteCohortSchemaTypes = z.infer<typeof DeleteCohortSchema>;

export const SubmitDeleteCohortSchema = DeleteCohortSchema;

export type DeleteCohortSubmitValues = z.infer<typeof SubmitDeleteCohortSchema>;

// =====================================================================================
// Assign Users to Cohort Schema
// =====================================================================================

export const AssignUsersToCohortSchema = z.object({
  cohortId: z.string().uuid(),
  enrollmentIds: z
    .array(z.string().uuid())
    .min(1, { message: 'Please select at least one user to assign' }),
});

export type AssignUsersToCohortSchemaTypes = z.infer<typeof AssignUsersToCohortSchema>;

export const SubmitAssignUsersToCohortSchema = AssignUsersToCohortSchema;

export type AssignUsersToCohortSubmitValues = z.infer<typeof SubmitAssignUsersToCohortSchema>;

// =====================================================================================
// Remove User from Cohort Schema
// =====================================================================================

export const RemoveUserFromCohortSchema = z.object({
  enrollmentId: z.string().uuid(),
});

export type RemoveUserFromCohortSchemaTypes = z.infer<typeof RemoveUserFromCohortSchema>;
