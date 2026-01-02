import { z } from 'zod';

// Camera settings schema
export const CameraPositionSchema = z.tuple([z.number(), z.number(), z.number()]);
export const CameraTargetSchema = z.tuple([z.number(), z.number(), z.number()]);

export const CameraSettingsSchema = z.object({
  position: CameraPositionSchema,
  target: CameraTargetSchema,
  fov: z.number().min(10).max(120),
  zoom: z.number().min(0.1).max(10),
});

// Lighting settings schema
export const DirectionalLightSchema = z.object({
  intensity: z.number().min(0).max(10),
  position: z.tuple([z.number(), z.number(), z.number()]),
});

export const LightingSettingsSchema = z.object({
  ambient: z.number().min(0).max(10),
  directional: DirectionalLightSchema,
});

// Complete 3D model settings schema
export const Model3DSettingsSchema = z.object({
  camera: CameraSettingsSchema,
  scale: z.number().min(0.001).max(100),
  lighting: LightingSettingsSchema,
});

// File library settings (extensible for other file types in future)
export const FileSettingsSchema = z.object({
  model3d: Model3DSettingsSchema.optional(),
});

// TypeScript types
export type CameraPosition = z.infer<typeof CameraPositionSchema>;
export type CameraTarget = z.infer<typeof CameraTargetSchema>;
export type CameraSettings = z.infer<typeof CameraSettingsSchema>;
export type DirectionalLight = z.infer<typeof DirectionalLightSchema>;
export type LightingSettings = z.infer<typeof LightingSettingsSchema>;
export type Model3DSettings = z.infer<typeof Model3DSettingsSchema>;
export type FileSettings = z.infer<typeof FileSettingsSchema>;

// Default settings matching current hardcoded values
export const DEFAULT_MODEL_SETTINGS: Model3DSettings = {
  camera: {
    position: [-10, 0, 0],
    target: [0, 0, 0],
    fov: 45,
    zoom: 1,
  },
  scale: 0.01,
  lighting: {
    ambient: 0.5,
    directional: {
      intensity: 1,
      position: [0, 1, 1],
    },
  },
};
