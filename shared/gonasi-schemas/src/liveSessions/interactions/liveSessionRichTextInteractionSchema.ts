import { z } from 'zod';

export const LiveSessionRichTextStateInteractionSchema = z.object({
  plugin_type: z.literal('live_session_rich_text'),
});
