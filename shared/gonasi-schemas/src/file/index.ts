import { z } from 'zod';

// ----------------------
// Constants & Types
// ----------------------

export const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB

export enum FileType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  MODEL_3D = 'model3d',
  DOCUMENT = 'document',
  OTHER = 'other',
}

export const ALLOWED_EXTENSIONS: Record<FileType, string[]> = {
  [FileType.IMAGE]: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic'],
  [FileType.AUDIO]: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff', 'aif'],
  [FileType.VIDEO]: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'],
  [FileType.MODEL_3D]: ['gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz'],
  [FileType.DOCUMENT]: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
  [FileType.OTHER]: [],
};

// ----------------------
// MIME Types
// ----------------------

const MIME_TYPES: Record<string, string> = {
  // Image
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  heic: 'image/heic',
  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  aiff: 'audio/aiff',
  aif: 'audio/aiff',
  // Video
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  flv: 'video/x-flv',
  wmv: 'video/x-ms-wmv',
  // 3D Models
  gltf: 'model/gltf+json',
  glb: 'model/gltf-binary',
  obj: 'model/obj',
  fbx: 'model/fbx',
  stl: 'model/stl',
  dae: 'model/vnd.collada+xml',
  '3ds': 'model/3ds',
  usdz: 'model/vnd.usdz+zip',
  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
};

// ----------------------
// Utility Functions
// ----------------------

const ALL_EXTENSIONS: string[] = Object.values(ALLOWED_EXTENSIONS).flat();

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getFileType = (extension: string): FileType => {
  if (ALLOWED_EXTENSIONS[FileType.IMAGE].includes(extension)) return FileType.IMAGE;
  if (ALLOWED_EXTENSIONS[FileType.AUDIO].includes(extension)) return FileType.AUDIO;
  if (ALLOWED_EXTENSIONS[FileType.VIDEO].includes(extension)) return FileType.VIDEO;
  if (ALLOWED_EXTENSIONS[FileType.MODEL_3D].includes(extension)) return FileType.MODEL_3D;
  if (ALLOWED_EXTENSIONS[FileType.DOCUMENT].includes(extension)) return FileType.DOCUMENT;
  return FileType.OTHER;
};

export const getMimeType = (extension: string): string => {
  return MIME_TYPES[extension] || 'application/octet-stream';
};

export interface FileMetadata {
  name: string;
  size: number;
  mime_type: string;
  extension: string;
  file_type: FileType;
}

export const getFileMetadata = (file: File): FileMetadata => {
  const extension = getFileExtension(file.name);
  const file_type = getFileType(extension);
  const mime_type = getMimeType(extension);
  const safeExtension = extension || 'bin';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${safeExtension}`;

  return {
    name: fileName,
    size: file.size,
    mime_type,
    extension: safeExtension,
    file_type,
  };
};

// ----------------------
// Validation Schemas
// ----------------------

export const FileNameSchema = z
  .string({ required_error: 'Please enter a name.' })
  .min(3, { message: 'The name must be at least 3 characters.' })
  .max(100, { message: 'The name must be 100 characters or fewer.' })
  .refine((val) => /^[\w\d\-_. ]+$/.test(val), {
    message: 'Name must contain only letters, numbers, spaces, dashes, or underscores.',
  });

export const NewFileTypeSchema = z.instanceof(File).superRefine((file, ctx) => {
  if (file.size === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'File is required.',
    });
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'File size must be less than 100MB.',
    });
  }

  const extension = getFileExtension(file.name);
  if (!ALL_EXTENSIONS.includes(extension)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Unsupported file type.',
    });
  }
});

export const NewFileLibrarySchema = z.object({
  file: NewFileTypeSchema,
  name: FileNameSchema,
  courseId: z.string(),
});
export type NewFileSchemaTypes = z.infer<typeof NewFileLibrarySchema>;

export const EditFileNameSchema = z.object({
  name: FileNameSchema,
  fileId: z.string(),
});

export type EditFileNameSchemaTypes = z.infer<typeof EditFileNameSchema>;

export const EditFileSchema = z.object({
  file: NewFileTypeSchema,
  fileId: z.string(),
  path: z.string(),
});

export type EditFileSchemaTypes = z.infer<typeof EditFileSchema>;

export const DeleteFileSchema = z.object({
  path: z.string(),
  name: z.string(),
  fileId: z.string(),
});

export type DeleteFileSchemaTypes = z.infer<typeof DeleteFileSchema>;
