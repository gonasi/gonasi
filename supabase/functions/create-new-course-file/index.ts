// ────────────────────────────────────────────────────────────────────────────────
// file-upload.ts
// ------------------------------------------------------------------------------
// Handles file uploads for file_library
// - Validates request using Zod
// - Supports image variant generation + blurhash
// - Stores metadata in file_library table
// - Streams image processing using EdgeRuntime.waitUntil
// ────────────────────────────────────────────────────────────────────────────────

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { Image } from 'imagescript';
import { encode } from 'blurhash';

// ────────────────────────────────────────────────────────────────────────────────
// Logging Prefix
// ────────────────────────────────────────────────────────────────────────────────
const LOG_PREFIX = '📁 [file-upload]';

// ────────────────────────────────────────────────────────────────────────────────
// Env
// ────────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`${LOG_PREFIX} ❌ Missing required environment variables`);
}

// ────────────────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────────────────
const FILE_LIBRARY_BUCKET = 'files';

const IMAGE_VARIANTS = [
  { suffix: 'thumb', width: 150, quality: 80 },
  { suffix: 'small', width: 400, quality: 85 },
  { suffix: 'medium', width: 800, quality: 90 },
] as const;

// ────────────────────────────────────────────────────────────────────────────────
// Validation Schema
// ────────────────────────────────────────────────────────────────────────────────
const UploadMetadataSchema = z.object({
  organizationId: z.string().uuid(),
  courseId: z.string().uuid(),
  name: z.string().min(1),
  userId: z.string().uuid(),
});

// ────────────────────────────────────────────────────────────────────────────────
// Helper: JSON Response
// ────────────────────────────────────────────────────────────────────────────────
function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// File metadata extraction
// ────────────────────────────────────────────────────────────────────────────────
function getFileMetadata(file: File) {
  const mimeType = file.type || 'application/octet-stream';
  const name = file.name;
  const extension = name.split('.').pop()?.toLowerCase() ?? 'bin';

  const fileType = (() => {
    const ext = extension;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic'].includes(ext))
      return 'image';
    if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff'].includes(ext)) return 'audio';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)) return 'video';
    if (['gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz'].includes(ext)) return 'model3d';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext))
      return 'document';
    return 'other';
  })();

  return { name, size: file.size, mimeType, extension, fileType };
}

// ────────────────────────────────────────────────────────────────────────────────
// Blurhash
// ────────────────────────────────────────────────────────────────────────────────
async function generateBlurhash(imageBuffer: Uint8Array): Promise<string> {
  const image = await Image.decode(imageBuffer);
  const resized = image.resize(32, 32);
  return encode(new Uint8ClampedArray(resized.bitmap), resized.width, resized.height, 4, 4);
}

// ────────────────────────────────────────────────────────────────────────────────
// Variant generation
// ────────────────────────────────────────────────────────────────────────────────
async function generateImageVariant(
  imageBuffer: Uint8Array,
  width: number,
  quality: number,
): Promise<Uint8Array> {
  const image = await Image.decode(imageBuffer);
  const height = Math.round(width * (image.height / image.width));
  return await image.resize(width, height).encodeJPEG(quality);
}

// ────────────────────────────────────────────────────────────────────────────────
// Background Variant Processing
// ────────────────────────────────────────────────────────────────────────────────
async function processImageVariants({
  fileId,
  organizationId,
  courseId,
  storagePath,
  imageBuffer,
  extension,
}: {
  fileId: string;
  organizationId: string;
  courseId: string;
  storagePath: string;
  imageBuffer: Uint8Array;
  extension: string;
}) {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const blurhash = await generateBlurhash(imageBuffer);

    await supabase.from('file_library').update({ blur_preview: blurhash }).eq('id', fileId);

    const basePath = storagePath.replace(`.${extension}`, '');

    await Promise.all(
      IMAGE_VARIANTS.map(async ({ suffix, width, quality }) => {
        try {
          const variantBuffer = await generateImageVariant(imageBuffer, width, quality);
          const variantPath = `${basePath}_${suffix}.${extension}`;
          await supabase.storage.from(FILE_LIBRARY_BUCKET).upload(variantPath, variantBuffer, {
            contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
            upsert: false,
          });
          console.log(`${LOG_PREFIX} ✔ Generated variant: ${variantPath}`);
        } catch (err) {
          console.error(`${LOG_PREFIX} ❌ Failed to generate ${suffix} variant`, err);
        }
      }),
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Error generating variants/blurhash`, error);
  }
}

// ────────────────────────────────────────────────────────────────────────────────
console.log(`${LOG_PREFIX} 🚀 Function started`);

// ────────────────────────────────────────────────────────────────────────────────
// Entry Point
// ────────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    return json({ error: 'Server config invalid' }, 500);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return json({ error: 'Invalid multipart form-data' }, 400);
  }

  const file = formData.get('file') as File | null;
  const metadata = UploadMetadataSchema.safeParse({
    organizationId: formData.get('organizationId'),
    courseId: formData.get('courseId'),
    name: formData.get('displayName') ?? formData.get('name'),
    userId: formData.get('userId'),
  });

  if (!metadata.success) {
    console.error(`${LOG_PREFIX} ❌ Validation failed`, metadata.error.flatten().fieldErrors);
    return json({ error: 'Validation failed', details: metadata.error.flatten().fieldErrors }, 400);
  }

  if (!file) return json({ error: 'Missing file field in upload' }, 400);

  const { organizationId, courseId, name, userId } = metadata.data;
  const { size, extension, mimeType, fileType } = getFileMetadata(file);

  const fileId = crypto.randomUUID();
  const storagePath = `${organizationId}/${courseId}/${fileId}.${extension}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  console.log(`${LOG_PREFIX} ⬆ Uploading file`, { storagePath });

  const { error: uploadError } = await supabase.storage
    .from(FILE_LIBRARY_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
      metadata: {
        size: size.toString(),
        organizationId,
        courseId,
        originalName: name,
        extension,
        file_type: fileType,
      },
    });

  if (uploadError) {
    console.error(`${LOG_PREFIX} ❌ Upload failed`, uploadError);
    return json({ error: `File upload failed: ${uploadError.message}` }, 400);
  }

  const { data: record, error: insertError } = await supabase
    .from('file_library')
    .insert({
      id: fileId,
      course_id: courseId,
      organization_id: organizationId,
      name,
      path: storagePath,
      size,
      mime_type: mimeType,
      extension,
      file_type: fileType,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(FILE_LIBRARY_BUCKET).remove([storagePath]);
    return json({ error: `Database insert failed: ${insertError.message}` }, 500);
  }

  // Generate variants in background
  if (fileType === 'image' && ['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    EdgeRuntime.waitUntil(
      processImageVariants({
        fileId,
        organizationId,
        courseId,
        storagePath,
        imageBuffer: buffer,
        extension,
      }),
    );
  }

  console.log(`${LOG_PREFIX} ✔ Upload succeeded`, { id: record.id });

  return json(
    {
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: record.id,
        path: record.path,
        name: record.name,
        fileType: record.file_type,
      },
    },
    201,
  );
});
