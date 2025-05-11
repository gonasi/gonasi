import { z } from 'zod';

const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB

export const ALLOWED_EXTENSIONS = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic'],
  AUDIO: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff', 'aif'],
  VIDEO: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'],
  MODEL_3D: ['gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
};

export enum FileType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  MODEL_3D = 'model3d',
  DOCUMENT = 'document',
  OTHER = 'other',
}

const ALL_EXTENSIONS = [
  ...ALLOWED_EXTENSIONS.IMAGE,
  ...ALLOWED_EXTENSIONS.AUDIO,
  ...ALLOWED_EXTENSIONS.VIDEO,
  ...ALLOWED_EXTENSIONS.MODEL_3D,
  ...ALLOWED_EXTENSIONS.DOCUMENT,
];

const getFileExtension = (filename: string) => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const NewFileSchema = z.instanceof(File).superRefine((file, ctx) => {
  if (file.size === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'File is required',
    });
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'File size must be less than 100MB',
    });
  }

  const extension = getFileExtension(file.name);

  if (!ALL_EXTENSIONS.includes(extension)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Unsupported file type',
    });
  }
});
