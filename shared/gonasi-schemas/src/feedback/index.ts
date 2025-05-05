import { z } from 'zod';

// Experience field
export const ExperienceSchema = z.enum(['Loved it', 'It was okay', 'I struggled'], {
  required_error: 'Please select your experience.',
});

// Hardest part (Pain point) field
export const HardestPartSchema = z
  .string({ required_error: 'Please tell us what was hardest.' })
  .min(3, { message: 'Response is too short.' })
  .max(500, { message: 'Response is too long.' })
  .trim();

// Best part (Positive feedback) field
export const BestPartSchema = z
  .string({ required_error: 'Please tell us what you enjoyed.' })
  .min(3, { message: 'Response is too short.' })
  .max(500, { message: 'Response is too long.' })
  .trim();

// NPS score field
export const NpsScoreSchema = z
  .number({
    required_error: 'Please rate if you would recommend us.',
    invalid_type_error: 'NPS score must be a number.',
  })
  .int({ message: 'NPS score must be an integer.' })
  .min(0, { message: 'Score must be at least 0.' })
  .max(10, { message: 'Score cannot be more than 10.' });

// Share feedback publicly field
export const ShareFeedbackSchema = z.enum(['Yes', 'No'], {
  required_error: 'Please let us know if we can share your feedback.',
});

// Email (optional) field
export const EmailSchema = z
  .string()
  .email({ message: 'Please enter a valid email address.' })
  .optional()
  .or(z.literal('')); // allow empty string if they leave it blank

// Final feedback form schema
export const FeedbackFormSchema = z.object({
  experience: ExperienceSchema,
  hardestPart: HardestPartSchema,
  bestPart: BestPartSchema,
  npsScore: NpsScoreSchema,
  shareFeedback: ShareFeedbackSchema,
  email: EmailSchema,
});

export type FeedbackSubmitValues = z.infer<typeof FeedbackFormSchema>;
