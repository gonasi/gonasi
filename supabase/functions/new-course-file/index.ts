// ============================================================================
// Edge Function: File Upload
// ============================================================================

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getMimeTypeFromFileName,
} from '@shared/cloudinary.ts';
import { supabaseAdmin, createUserClient } from '@shared/supabaseClient.ts';

console.log('[new-course-file] Function initialized');

// ---------------------------
// Request Validation Schema
// ---------------------------
const UploadPayloadSchema = z.object({
  organization_id: z.string().uuid(),
  course_id: z.string().uuid(),
  file_name: z.string().min(1),
  mime_type: z.string().optional(),
  file_type: z.enum(['image', 'video', 'audio', 'model3d', 'document', 'other']),
  file_data: z.string().min(20),
});

// ---------------------------
// Main Handler
// ---------------------------
Deno.serve(async (req) => {
  try {
    // ---------------------------
    // Authenticate user
    // ---------------------------
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const userClient = createUserClient(token);
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

    // ---------------------------
    // Parse & validate request
    // ---------------------------
    const body = UploadPayloadSchema.parse(await req.json());

    // Convert to data URI
    // body.file_data is base64 string only (no prefix)
    const mimeType = getMimeTypeFromFileName(body.file_name, body.file_type);
    const fileDataUri = `data:${mimeType};base64,${body.file_data}`;

    const cloudRes = await uploadToCloudinary({
      file_data: fileDataUri,
      file_name: body.file_name,
      folder: `${body.organization_id}/${body.course_id}/unpublished`,
      isPublic: false,
    });

    // ---------------------------
    // Store metadata in DB
    // ---------------------------
    const { data, error } = await supabaseAdmin
      .from('course_files')
      .insert({
        organization_id: body.organization_id,
        course_id: body.course_id,
        created_by: user.id,
        updated_by: user.id,
        name: body.file_name,
        file_type: body.file_type,
        public_id: cloudRes.public_id,
        access_mode: 'authenticated',
        resource_type: cloudRes.resource_type,
        format: cloudRes.format,
        mime_type: mimeType,
        bytes: cloudRes.bytes,
        metadata: {
          width: cloudRes.width ?? null,
          height: cloudRes.height ?? null,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[db] Insert error:', error);
      await deleteFromCloudinary(cloudRes.public_id, cloudRes.resource_type, 'authenticated');
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('[new-course-file] Uncaught error:', err);
    const message =
      err instanceof z.ZodError
        ? `Validation error: ${err.errors.map((e) => e.message).join(', ')}`
        : err instanceof Error
          ? err.message
          : 'Unknown error';

    return new Response(JSON.stringify({ error: message }), {
      status: err instanceof z.ZodError ? 400 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
