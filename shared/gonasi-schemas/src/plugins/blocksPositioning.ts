import { z } from 'zod';

export const BlocksPositionUpdateSchema = z.object({
  id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  position: z.number().int(),
  updated_by: z.string().uuid(),
});

export const BlocksPositionUpdateArraySchema = z.array(BlocksPositionUpdateSchema);

export type BlocksPositionUpdate = z.infer<typeof BlocksPositionUpdateSchema>;
export type BlocksPositionUpdateArray = z.infer<typeof BlocksPositionUpdateArraySchema>;
