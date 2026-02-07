import { z } from 'zod';

import { NonEmptyLexicalState } from '../../../plugins';

export const LiveSessionRichTextContentSchema = z.object({
  richTextState: NonEmptyLexicalState,
});

export const LiveSessionRichTextSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization Id is required.' }),
  live_session_id: z.string().uuid(),
  plugin_type: z.literal('live_session_rich_text'),
  content: LiveSessionRichTextContentSchema,
  settings: z.object({}),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  time_limit: z
    .number()
    .int()
    .min(5, 'Time limit must be at least 5 seconds')
    .max(30, 'Time limit cannot exceed 30 seconds')
    .default(10),
});
export type LiveSessionRichTextSchemaTypes = z.infer<typeof LiveSessionRichTextSchema>;
