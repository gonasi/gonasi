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

const RequestSchema = z.object({
  avatar_url: z.string().min(1),
  user_id: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (err) {
    console.error('Failed to parse JSON body:', err);
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

  const { avatar_url, user_id } = parsed.data;

  try {
    // Step 1: Generate signed URL
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('profile_photos')
      .createSignedUrl(avatar_url, 60);

    if (urlError || !signedUrlData?.signedUrl) {
      console.error('[generate-blurhash] Failed to generate signed URL:', urlError);
      return new Response(JSON.stringify({ error: 'Could not generate signed URL' }), {
        status: 500,
      });
    }

    // Step 2: Download image
    const imageResponse = await fetch(signedUrlData.signedUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }
    const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());

    // Step 3: Decode image using ImageScript
    const image = await Image.decode(imageBuffer);

    // Step 4: Resize for performance (optional, BlurHash recommends small size)
    const resized = image.resize(32, 32); // small size = fast & good enough

    // Step 5: Extract pixel data
    const pixels = resized.bitmap;
    const width = resized.width;
    const height = resized.height;

    const blurHash = encode(pixels, width, height, 4, 4); // xComp, yComp = 4

    // Step 6: Save blur hash to user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ blur_hash: blurHash })
      .eq('id', user_id);

    if (updateError) {
      console.error('[generate-blurhash] Failed to update profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update blur_hash' }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, blur_hash: blurHash }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[generate-blurhash] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), {
      status: 500,
    });
  }
});
