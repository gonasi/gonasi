// Import Supabase Edge Runtime types
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { encode } from 'https://esm.sh/blurhash';
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';

console.log('[generate-blurhash] Function initialized');

// === Load environment variables ===
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('[generate-blurhash] Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// === Schema for API Request ===
const RequestSchema = z.object({
  bucket: z.string().min(1),
  object_key: z.string().min(1),
  table: z.string().min(1),
  column: z.string().min(1),
  row_id_column: z.string().min(1),
  row_id_value: z.union([z.string().uuid(), z.string().min(1)]),
});

async function generateBlurHashTask(
  bucket: string,
  object_key: string,
  table: string,
  column: string,
  row_id_column: string,
  row_id_value: string,
) {
  try {
    console.log(`[generate-blurhash] Task started for table: ${table}, row: ${row_id_value}`);

    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(object_key, 60);

    if (urlError || !signedUrlData?.signedUrl) {
      console.error('[generate-blurhash] Failed to generate signed URL:', urlError);
      throw new Error('Could not generate signed URL');
    }

    // Fetch and decode the image
    const imageResponse = await fetch(signedUrlData.signedUrl);
    if (!imageResponse.ok) throw new Error('Failed to download image');

    const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
    const image = await Image.decode(imageBuffer);

    // Resize to a smaller size for blurhash (optional but recommended for performance)
    const resized = image.resize(32, 32);

    // Convert imagescript bitmap to Uint8ClampedArray format expected by blurhash
    // imagescript stores pixels as RGBA in a Uint8Array, we need to convert to Uint8ClampedArray
    const pixels = new Uint8ClampedArray(resized.bitmap);

    // Generate blurhash with the converted pixel data
    const blurHash = encode(pixels, resized.width, resized.height, 4, 4);

    const { error: updateError } = await supabase
      .from(table)
      .update({ [column]: blurHash })
      .eq(row_id_column, row_id_value);

    if (updateError) {
      console.error('[generate-blurhash] Failed to update table:', updateError);
      throw new Error('Failed to update table with blurhash');
    }

    console.log(`[generate-blurhash] BlurHash saved for ${table}.${column}`);
    return blurHash;
  } catch (error) {
    console.error('[generate-blurhash] Error in task:', error);
    throw error;
  }
}

addEventListener('beforeunload', (ev) => {
  console.log('[generate-blurhash] Function will shutdown due to', ev);
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (err) {
    console.error('Failed to parse JSON:', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 });
  }

  const parsed = RequestSchema.safeParse(json);
  if (!parsed.success) {
    const errorMessages = parsed.error.flatten().fieldErrors;
    console.error('Validation failed:', errorMessages);
    return new Response(JSON.stringify({ error: 'Validation failed', details: errorMessages }), {
      status: 400,
    });
  }

  const { bucket, object_key, table, column, row_id_column, row_id_value } = parsed.data;

  try {
    EdgeRuntime.waitUntil(
      generateBlurHashTask(bucket, object_key, table, column, row_id_column, row_id_value).catch(
        (error) => {
          console.error('[generate-blurhash] Background task failed:', error);
        },
      ),
    );

    return new Response(
      JSON.stringify({ success: true, message: 'BlurHash generation started in background' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[generate-blurhash] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), { status: 500 });
  }
});
