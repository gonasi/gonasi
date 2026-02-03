import { z } from 'zod';

// Session name schema
export const LiveSessionNameSchema = z
  .string({ required_error: 'Please enter a session name.' })
  .trim()
  .min(3, { message: 'The session name must be at least 3 characters long.' })
  .max(100, { message: 'The session name cannot exceed 100 characters.' });

// Session description schema
export const LiveSessionDescriptionSchema = z
  .string()
  .max(500, { message: 'The description cannot exceed 500 characters.' })
  .trim()
  .optional();

// Session key schema (password for private sessions)
export const LiveSessionKeySchema = z
  .string()
  .min(4, { message: 'The session key must be at least 4 characters long.' })
  .max(50, { message: 'The session key cannot exceed 50 characters.' })
  .trim()
  .optional();

// Visibility enum
export const LiveSessionVisibilitySchema = z.enum(['public', 'unlisted', 'private'], {
  required_error: 'Please select a visibility option.',
});

// New Live Session Schema
export const NewLiveSessionSchema = z
  .object({
    name: LiveSessionNameSchema,
    description: LiveSessionDescriptionSchema,
    organizationId: z.string().uuid(),
    visibility: LiveSessionVisibilitySchema.default('public'),
    sessionKey: LiveSessionKeySchema,
    maxParticipants: z.number().int().positive().max(1000).optional().nullable(),
    allowLateJoin: z.boolean().default(true),
    showLeaderboard: z.boolean().default(true),
    enableChat: z.boolean().default(false),
    enableReactions: z.boolean().default(true),
    timeLimitPerQuestion: z.number().int().positive().max(600).optional().nullable(), // max 10 minutes per question
  })
  .refine(
    (data) => {
      // If visibility is 'private', sessionKey is required
      if (data.visibility === 'private') {
        return !!data.sessionKey && data.sessionKey.length >= 4;
      }
      return true;
    },
    {
      message: 'Session key is required for private sessions and must be at least 4 characters long.',
      path: ['sessionKey'],
    },
  );

export type NewLiveSessionSchemaTypes = z.infer<typeof NewLiveSessionSchema>;

// Edit Live Session Details Schema
export const EditLiveSessionDetailsSchema = z.object({
  sessionId: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: LiveSessionNameSchema,
  description: LiveSessionDescriptionSchema,
  scheduledStartTime: z.string().datetime().optional().nullable(),
});

export type EditLiveSessionDetailsSchemaTypes = z.infer<typeof EditLiveSessionDetailsSchema>;

// Edit Live Session Settings Schema
export const EditLiveSessionSettingsSchema = z
  .object({
    sessionId: z.string().uuid(),
    organizationId: z.string().uuid(),
    visibility: LiveSessionVisibilitySchema,
    sessionKey: LiveSessionKeySchema,
    maxParticipants: z.number().int().positive().max(1000).optional().nullable(),
    allowLateJoin: z.boolean(),
    showLeaderboard: z.boolean(),
    enableChat: z.boolean(),
    enableReactions: z.boolean(),
    timeLimitPerQuestion: z.number().int().positive().max(600).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.visibility === 'private') {
        return !!data.sessionKey && data.sessionKey.length >= 4;
      }
      return true;
    },
    {
      message: 'Session key is required for private sessions.',
      path: ['sessionKey'],
    },
  );

export type EditLiveSessionSettingsSchemaTypes = z.infer<typeof EditLiveSessionSettingsSchema>;

// Delete Live Session Schema
export const DeleteLiveSessionSchema = z.object({
  sessionId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type DeleteLiveSessionSchemaTypes = z.infer<typeof DeleteLiveSessionSchema>;

// Join Live Session Schema
export const JoinLiveSessionSchema = z.object({
  sessionCode: z.string().min(6).max(6),
  sessionKey: z.string().optional(), // Required only for private sessions
  displayName: z.string().min(2).max(50).optional(), // Optional display name for leaderboard
});

export type JoinLiveSessionSchemaTypes = z.infer<typeof JoinLiveSessionSchema>;

// Start Live Session Schema - validates that session is ready to start
export const StartLiveSessionSchema = z.object({
  sessionId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type StartLiveSessionSchemaTypes = z.infer<typeof StartLiveSessionSchema>;

// Update Session Status Schema (for starting, pausing, ending session)
export const UpdateSessionStatusSchema = z.object({
  sessionId: z.string().uuid(),
  organizationId: z.string().uuid(),
  status: z.enum(['waiting', 'active', 'paused', 'ended']),
});

export type UpdateSessionStatusSchemaTypes = z.infer<typeof UpdateSessionStatusSchema>;
