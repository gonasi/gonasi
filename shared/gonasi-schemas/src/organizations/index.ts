import { z } from 'zod';

const OrganizationNameSchema = z
  .string({
    required_error: `Missing <span class="go-title">organization name</span>, this field is required <lucide name="AlertCircle" size="12" />`,
  })
  .min(3, {
    message: `<span class="go-title">Organization name</span> must be at least 3 characters long.`,
  })
  .max(100, {
    message: `Keep your <span class="go-title">organization name</span> under 100 characters to avoid display issues.`,
  })
  .trim();

const OrganizationHandleSchema = z
  .string({
    required_error: `Please provide a <span class="go-title">handle</span> for your organization`,
  })
  .min(3, {
    message: `<span class="go-title">Handle</span> must be at least 3 characters. <lucide name="TextCursorInput" size="12" />`,
  })
  .max(100, {
    message: `Your <span class="go-title">handle</span> is too long, max 100 characters allowed.`,
  })
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: `Use only letters, numbers, dashes, or underscores in your <span class="go-title">handle</span> <lucide name="Code2" size="12" />`,
  })
  .trim();

export const NewOrganizationSchema = z.object({
  name: OrganizationNameSchema,
  handle: OrganizationHandleSchema,
});

export type NewOrganizationSchemaTypes = z.infer<typeof NewOrganizationSchema>;
