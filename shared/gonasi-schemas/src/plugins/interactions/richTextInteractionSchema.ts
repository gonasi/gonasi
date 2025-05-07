import { z } from 'zod';

import { InteractionBaseSchema } from '../pluginTypes';

export const RichTextInteractionSchema = InteractionBaseSchema.extend({
  action: z.literal('continue'),
});
