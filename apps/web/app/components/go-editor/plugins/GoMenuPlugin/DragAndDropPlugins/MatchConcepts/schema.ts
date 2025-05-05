import { z } from 'zod';

export const schema = z.object({
  titleState: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(1, 'Title cannot be empty.'),

  itemsState: z
    .array(
      z.object({
        itemState: z
          .string({ required_error: 'Item is required.' })
          .trim()
          .min(1, 'Item cannot be empty.'),
        valueState: z
          .string({ required_error: 'Value is required.' })
          .trim()
          .min(1, 'Value cannot be empty.'),
      }),
    )
    .min(1, 'At least one item is required.'),

  uuid: z.string().optional(),
});

export type MatchConceptsParams = z.infer<typeof schema>;
