import { z } from 'zod';

const MAX_SIZE = 1024 * 1024 * 5; // 5MB
const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

export const EmailSchema = z
  .string({
    required_error:
      'Just need your <span class="go-title">email address</span> to continue <lucide name="Mail" size="12" />',
  })
  .email({
    message: 'Hmm, that email doesn’t look quite right <lucide name="AlertCircle" size="12" />',
  })
  .min(3, {
    message:
      '<span class="warning">That email looks a bit short</span> <lucide name="MoveHorizontal" size="12" />',
  })
  .max(100, {
    message:
      '<span class="warning">That email’s a little too long</span> <lucide name="ScanLine" size="12" />',
  })
  .trim()
  .transform((value) => value.toLowerCase());

export const PasswordSchema = z
  .string({
    required_error: `<lucide name="Lock" size="12" /> We’ll need a <span class="go-title">password</span> to continue`,
  })
  .min(6, {
    message: `<span class="warning">Too short!</span> Make it at least 6 characters <lucide name="ArrowRight" size="12" />`,
  })
  .refine((val) => new TextEncoder().encode(val).length <= 40, {
    message: `<lucide name="Minimize" size="12" /> <span class="warning">Whoa, that’s a long one</span> — keep it under 40 characters`,
  });

export const SignUpPasswordSchema = z
  .string({
    required_error: `<lucide name="Lock" size="12" /> We’ll need a <span class="go-title">password</span> to continue`,
  })
  .min(6, {
    message: `<span class="warning">Too short!</span> Your <span class="go-title">password</span> must be at least 6 characters <lucide name="ArrowRight" size="12" />`,
  })
  .refine((val) => new TextEncoder().encode(val).length <= 40, {
    message: `<lucide name="Minimize" size="12" /> <span class="warning">Whoa, that’s a long one</span> — keep your <span class="go-title">password</span> under 40 characters`,
  })
  .refine((val) => /[A-Z]/.test(val), {
    message: `<lucide name="ArrowUpCircle" size="12" /> Your <span class="go-title">password</span> needs at least one uppercase letter`,
  })
  .refine((val) => /[a-z]/.test(val), {
    message: `<lucide name="ArrowDownCircle" size="12" /> Your <span class="go-title">password</span> needs at least one lowercase letter`,
  })
  .refine((val) => /\d/.test(val), {
    message: `<lucide name="Hash" size="12" /> Your <span class="go-title">password</span> must include a number`,
  })
  .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
    message: `<lucide name="Asterisk" size="12" /> Add a special character to your <span class="go-title">password</span>`,
  });

export const FullNameSchema = z
  .string({
    required_error: `<lucide name="User" size="12" /> We’ll need a name`,
  })
  .min(3, {
    message: `That name's a little <span class="warning">short</span> <lucide name="MoveVertical" size="12" />`,
  })
  .max(100, {
    message: `<span class="warning">That name’s a bit too long</span> <lucide name="ScanLine" size="12" />`,
  })
  .trim()
  .refine((val) => /^[A-Za-z0-9&.,'’\-]+(?: [A-Za-z0-9&.,'’\-]+)*$/.test(val), {
    message: `Use letters, numbers, or basic punctuation <lucide name="Type" size="12" />`,
  });

export const UsernameSchema = z
  .string({
    required_error: `<lucide name="UserCircle2" size="12" /> Pick a <span class="go-title">username</span>`,
  })
  .min(3, {
    message: `<span class="warning">Too short!</span> Usernames need 3+ characters <lucide name="ArrowRight" size="12" />`,
  })
  .max(50, {
    message: `<span class="warning">That username’s too long</span> <lucide name="ScanLine" size="12" />`,
  })
  .trim()
  .toLowerCase()
  .regex(/^(?!.*[_.]{2})[a-z0-9][a-z0-9._]*[a-z0-9]$/, {
    message: `Use only lowercase letters, numbers, dots, and underscores <lucide name="Code2" size="12" /> — no doubles or ending/starting with symbols`,
  })
  .transform((value) => value.toLowerCase());

export const PhoneNumberSchema = z
  .string({
    required_error: `<lucide name="Phone" size="12" /> A phone number is required`,
  })
  .trim()
  .length(9, {
    message: `<span class="warning">Should be exactly 9 digits</span> <lucide name="ScanLine" size="12" />`,
  })
  .regex(/^\d{9}$/, {
    message: `Just the digits please <lucide name="Hash" size="12" />`,
  });

export const NewImageSchema = z.any().superRefine((file, ctx) => {
  if (!(file instanceof File)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please upload a valid image file <lucide name="ImageOff" size="12" />',
    });
    return;
  }

  if (file.size === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Looks like you didn’t select an image <lucide name="FileQuestion" size="12" />',
    });
  }

  if (file.size > MAX_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'That image is too large — max 5MB please <lucide name="FileWarning" size="12" />',
    });
  }

  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG, JPG, JPEG, or GIF images allowed <lucide name="Image" size="12" />',
    });
  }
});
