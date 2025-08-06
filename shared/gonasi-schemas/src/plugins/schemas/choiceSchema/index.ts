import { z } from 'zod';

//
// Base Choice Schema
//
const BaseChoiceSchema = z.object({
  id: z.string().uuid({
    message: `Invalid <span class="go-title">id</span>; must be a valid UUID.`,
  }),

  isCorrect: z.boolean({
    required_error: `Mark whether this <span class="go-title">choice</span> is correct <lucide name="CheckCircle" size="12" />.`,
  }),
});
export type BaseChoiceSchemaTypes = z.infer<typeof BaseChoiceSchema>;

//
// Text Choice Schema
//
export const ChoiceSchema = BaseChoiceSchema.extend({
  content: z.string({
    required_error: `Add <span class="go-title">content</span> for this text choice.`,
    invalid_type_error: `<span class="go-title">Content</span> must be a string <lucide name="Text" size="12" />.`,
  }),
});
export type ChoiceSchemaTypes = z.infer<typeof ChoiceSchema>;

//
// Array of Choices
//
export const ChoicesArraySchema = z.array(ChoiceSchema, {
  invalid_type_error: `Expected an array of <span class="go-title">choices</span> <lucide name="List" size="12" />.`,
});
export type ChoicesArraySchemaTypes = z.infer<typeof ChoicesArraySchema>;
