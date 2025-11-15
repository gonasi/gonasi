import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { encode } from 'https://esm.sh/blurhash';
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';

console.log('[generate-blurhash] Function initialized');

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

// Helper to save image to ephemeral storage
async function saveToTempFile(buffer: Uint8Array) {
  const filepath = `/tmp/${crypto.randomUUID()}`;
  await Deno.writeFile(filepath, buffer);
  return filepath;
}

async function generateBlurHashTask(
  bucket: string,
  object_key: string,
  table: string,
  column: string,
  row_id_column: string,
  row_id_value: string,
) {
  console.log(`[generate-blurhash] Task started for table: ${table}, row: ${row_id_value}`);

  // Get a signed URL
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(object_key, 60);

  if (urlError || !signedUrlData?.signedUrl) {
    throw new Error(`[generate-blurhash] Failed to generate signed URL: ${urlError}`);
  }

  // Fetch image and write to ephemeral storage
  const imageResponse = await fetch(signedUrlData.signedUrl);
  if (!imageResponse.ok) throw new Error('Failed to download image');

  const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
  const tempPath = await saveToTempFile(imageBuffer);

  try {
    // Decode image from temp file
    const image = await Image.decode(await Deno.readFile(tempPath));

    // Resize for blurhash
    const resized = image.resize(32, 32);
    const pixels = new Uint8ClampedArray(resized.bitmap);

    // Generate blurhash
    const blurHash = encode(pixels, resized.width, resized.height, 4, 4);

    // Update Supabase table
    const { error: updateError } = await supabase
      .from(table)
      .update({ [column]: blurHash })
      .eq(row_id_column, row_id_value);

    if (updateError) throw updateError;

    console.log(`[generate-blurhash] BlurHash saved for ${table}.${column}`);
    return blurHash;
  } finally {
    // Clean up ephemeral storage
    await Deno.remove(tempPath).catch(() => {});
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 });
  }

  const parsed = RequestSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400 },
    );
  }

  const { bucket, object_key, table, column, row_id_column, row_id_value } = parsed.data;

  // Run in background to avoid blocking
  EdgeRuntime.waitUntil(
    generateBlurHashTask(bucket, object_key, table, column, row_id_column, row_id_value).catch(
      (err) => console.error('[generate-blurhash] Background task failed:', err),
    ),
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: 'BlurHash generation started in background',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
