import { z } from 'zod';

import { BasePluginSettingsSchema } from '../../pluginSettings';
import { NonEmptyLexicalState } from '../../utils';

export const StepByStepRevealCardSchema = z.object({
  id: z.string().uuid({
    message: `<lucide name="AlertCircle" size="12" /> Invalid <span class="go-title">id</span>; must be a valid UUID.`,
  }),
  frontContent: NonEmptyLexicalState,
  backContent: NonEmptyLexicalState,
});

export type StepByStepRevealCardSchemaTypes = z.infer<typeof StepByStepRevealCardSchema>;

export const StepByStepRevealContentSchema = z.object({
  id: z.string().uuid({
    message: `<lucide name="AlertCircle" size="12" /> Invalid <span class="go-title">id</span>; must be a valid UUID.`,
  }),
  title: NonEmptyLexicalState,
  cards: z
    .array(StepByStepRevealCardSchema)
    .min(
      1,
      `<lucide name="PlusCircle" size="12" /> At least one <span class="go-title">card</span> is required.`,
    )
    .max(
      10,
      `<lucide name="ListX" size="12" /> No more than 10 <span class="go-title">cards</span> are allowed.`,
    ),
});

export const StepByStepRevealSettingsSchema = BasePluginSettingsSchema.extend({});

export const StepByStepRevealSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({
    required_error: `<lucide name="Building2" size="12" /> <span class="go-title">Organization Id</span> is required.`,
  }),
  course_id: z.string({
    required_error: `<lucide name="BookOpen" size="12" /> <span class="go-title">Course Id</span> is required.`,
  }),
  chapter_id: z.string({
    required_error: `<lucide name="Layers" size="12" /> <span class="go-title">Chapter Id</span> is required.`,
  }),
  lesson_id: z.string({
    required_error: `<lucide name="GraduationCap" size="12" /> <span class="go-title">Lesson Id</span> is required.`,
  }),
  plugin_type: z.literal('step_by_step_reveal'),
  content: StepByStepRevealContentSchema,
  settings: StepByStepRevealSettingsSchema,
});

export type StepByStepRevealSchemaTypes = z.infer<typeof StepByStepRevealSchema>;
