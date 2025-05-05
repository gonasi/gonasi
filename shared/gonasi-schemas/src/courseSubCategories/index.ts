import { z } from 'zod';

// Schema for validating the subcategory name
const SubCategorySchema = z
  .string({ required_error: 'Subcategory is required' }) // Ensures the value is a string and required
  .min(3, { message: 'Subcategory is too short' }) // Minimum length of 3 characters
  .max(100, { message: 'Subcategory is too long' }) // Maximum length of 100 characters
  .refine((val) => /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(val), {
    message: 'Subcategory must have only one space between words and no leading/trailing spaces',
  }); // Custom validation to allow only letters and single spaces between words

// Schema for creating a new course subcategory
export const NewCourseSubCategorySchema = z.object({
  name: SubCategorySchema, // Uses the subcategory validation schema
});
export type NewCourseSubCategoryTypes = z.infer<typeof NewCourseSubCategorySchema>; // Type inference for TypeScript

// Schema for submitting a new course subcategory, including additional required fields
export const SubmitNewCourseSubCategorySchema = NewCourseSubCategorySchema.merge(
  z.object({
    courseCategoryId: z.string(), // The ID of the course category the subcategory belongs to
  }),
);
export type NewCourseSubCategorySubmitValues = z.infer<typeof SubmitNewCourseSubCategorySchema>;

// Schema for editing an existing course subcategory
export const EditCourseSubCategorySchema = z.object({
  name: SubCategorySchema, // Uses the same validation rules as new subcategories
});

// Schema for submitting an edited course subcategory with additional required fields
export const SubmitEditCourseSubCategorySchema = EditCourseSubCategorySchema.merge(
  z.object({
    courseSubCategoryId: z.string(), // The ID of the subcategory being edited
  }),
);
export type EditCourseSubCategorySubmitValues = z.infer<typeof SubmitEditCourseSubCategorySchema>;

// Schema for deleting a course subcategory
export const DeleteCourseSubCategorySchema = z.object({
  id: z.string(), // The ID of the subcategory to be deleted
});
export type DeleteCourseSubCategorySubmitValues = z.infer<typeof DeleteCourseSubCategorySchema>;
