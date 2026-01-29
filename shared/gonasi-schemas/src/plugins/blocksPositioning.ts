import { z } from 'zod';

export const BlocksPositionUpdateSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
});

export const BlocksPositionUpdateArraySchema = z.array(BlocksPositionUpdateSchema);

export const DeleteBlockSchema = z.object({
  blockId: z.string().uuid(),
});

export type BlocksPositionUpdate = z.infer<typeof BlocksPositionUpdateSchema>;
export type BlocksPositionUpdateArraySchemaTypes = z.infer<typeof BlocksPositionUpdateArraySchema>;
export type DeleteBlockSchemaTypes = z.infer<typeof DeleteBlockSchema>;
