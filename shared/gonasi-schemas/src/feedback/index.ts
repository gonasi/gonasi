import { z } from 'zod';

export const ExperienceSchema = z.enum(['Loved it', 'It was okay', 'I struggled'], {
  required_error: 'Tell us how it went—we really want to know!',
});

export const HardestPartSchema = z
  .string({ required_error: 'Tell us what stumped you—we’re listening!' })
  .min(3, { message: 'Too short—we’re all ears, give us more!' })
  .max(500, { message: 'Whoa, that’s a lot! Can you trim it down a bit?' })
  .trim();

export const BestPartSchema = z
  .string({ required_error: 'Tell us what made your day!' })
  .min(3, { message: 'Give us a little more of the good stuff!' })
  .max(500, { message: 'That’s a bit too much joy to handle—try shortening it 😄' })
  .trim();

export const NpsScoreSchema = z
  .number({
    required_error: 'Give us a rating—don’t be shy!',
    invalid_type_error: 'Just slide to a number, please!',
  })
  .int({ message: 'Whole numbers only, please!' })
  .min(0, { message: 'Score must be at least 0!' })
  .max(10, { message: 'Max is 10—save some stars for later!' });

export const ShareFeedbackSchema = z.enum(['Yes', 'No'], {
  required_error: 'Let us know if we can shout your feedback from the rooftops!',
});

export const EmailSchema = z
  .string()
  .email({ message: 'Oops! That doesn’t look like an email.' })
  .optional()
  .or(z.literal(''));

export const FeedbackFormSchema = z.object({
  experience: ExperienceSchema,
  hardestPart: HardestPartSchema,
  bestPart: BestPartSchema,
  npsScore: NpsScoreSchema,
  shareFeedback: ShareFeedbackSchema,
  email: EmailSchema,
});

export type FeedbackSubmitValues = z.infer<typeof FeedbackFormSchema>;
