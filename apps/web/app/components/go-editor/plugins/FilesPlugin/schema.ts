import { z } from 'zod';

export const NewEditorFileSchema = z.object({
  fileId: z.string(),
});
