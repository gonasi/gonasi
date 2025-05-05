import { z } from 'zod';

import { EmailSchema } from '../userValidation';

// InviteNewStaffSchema definition
export const InviteNewStaffSchema = z.object({
  email: EmailSchema,
});

export type InviteNewStaffTypes = z.infer<typeof InviteNewStaffSchema>;
export type InviteNewStaffSubmitValues = z.infer<typeof InviteNewStaffSchema>;

export const DeleteStaffSchema = z.object({
  id: z.string(),
});

export type DeleteStaffTypes = z.infer<typeof DeleteStaffSchema>;

export const StaffRoleSchema = z.enum(['admin', 'user']);

export const EditStaffSchema = z.object({
  staffRole: StaffRoleSchema,
});

export type EditStaffTypes = z.infer<typeof EditStaffSchema>;

export const SubmitEditStaffTypeSchema = EditStaffSchema.merge(
  z.object({
    staffId: z.string(),
  }),
);
export type EditStaffSubmitValues = z.infer<typeof SubmitEditStaffTypeSchema>;

export const LeaveTeamSchema = z.object({
  companyId: z.string(),
  redirect: z.string().nullable(),
});

export type LeaveTeamTypes = z.infer<typeof LeaveTeamSchema>;
