import { z } from 'zod';

export const schema = z.object({
  frontSideState: z
    .string({ required_error: 'Question is required.' })
    .trim()
    .min(10, 'The question must be at least 10 characters long.'),

  backSideState: z
    .string({ required_error: 'Reveal text is required.' })
    .trim()
    .min(10, 'Reveal text must be at least 10 characters.'),

  uuid: z.string().optional(),
});

export type TapToRevealParams = z.infer<typeof schema>;
