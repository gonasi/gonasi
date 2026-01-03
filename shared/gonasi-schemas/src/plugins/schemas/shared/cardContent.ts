import { z } from 'zod';

import { FileType } from '../../../file';
import { NonEmptyLexicalState } from '../../utils';

// ============================================================================
// Card Display Settings Schema (Shared)
// ============================================================================

export const CardDisplaySettingsSchema = z.object({
  noPadding: z.boolean().optional(),
  noBorder: z.boolean().optional(),
  objectFit: z.enum(['contain', 'cover', 'fill']).optional(),
  aspectRatio: z.enum(['auto', '1/1', '16/9', '4/3', '3/4']).optional(),
});
export type CardDisplaySettingsSchemaTypes = z.infer<typeof CardDisplaySettingsSchema>;

// ============================================================================
// Card Content Schema (Discriminated Union) (Shared)
// ============================================================================

export const CardContentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('richtext'),
    content: NonEmptyLexicalState,
  }),
  z.object({
    type: z.literal('asset'),
    assetId: z.string({ required_error: 'Asset is required.' }),
    fileType: z.nativeEnum(FileType),
    displaySettings: CardDisplaySettingsSchema.optional(),
  }),
]);
export type CardContentSchemaTypes = z.infer<typeof CardContentSchema>;
